// GDPR: Heuristic/vision analysis of damage photos. Never log file contents.
// Legal basis: Art. 6(1)(b) DSGVO.

import { env } from "@/lib/env"
import type {
  PhotoAnalysisResult,
  PhotoAnalysisSeverity,
} from "@/lib/ai/photo-analysis-types"

export type AnalyzePhotoInput = {
  fileName: string
  mimeType?: string | null
  fileSizeBytes?: number | null
  /** Optional JPEG/PNG/WebP bytes for vision providers (stripped of EXIF preferred). */
  imageBytes?: ArrayBuffer | null
  claimCategory?: string | null
  claimDescription?: string | null
}

const ROOM_KEYWORDS: Array<{ keys: string[]; room: string; base: number }> = [
  { keys: ["bad", "bath", "dusche", "shower", "wc"], room: "Bad", base: 4500 },
  { keys: ["kueche", "küche", "kitchen"], room: "Küche", base: 5200 },
  { keys: ["keller", "basement"], room: "Keller", base: 6800 },
  { keys: ["decke", "ceiling", "dach"], room: "Decke/Dach", base: 7500 },
  { keys: ["wohn", "living", "zimmer", "room"], room: "Wohnraum", base: 4000 },
  { keys: ["flur", "diele", "hall"], room: "Flur", base: 2800 },
]

const DAMAGE_KEYWORDS: Array<{ keys: string[]; type: string; severity: PhotoAnalysisSeverity; mult: number }> = [
  { keys: ["schimmel", "mold", "mould"], type: "Schimmel / Folgeschaden", severity: "critical", mult: 1.55 },
  { keys: ["rohrbruch", "pipe", "burst"], type: "Rohrbruch", severity: "high", mult: 1.35 },
  { keys: ["waschmaschine", "spuel", "spül", "appliance"], type: "Geräte-Leckage", severity: "medium", mult: 0.85 },
  { keys: ["nass", "wasser", "water", "feucht", "leak", "nasse"], type: "Wasserschaden", severity: "medium", mult: 1.0 },
  { keys: ["fleck", "flecken", "stain"], type: "Feuchtigkeitsfleck", severity: "low", mult: 0.65 },
]

const CATEGORY_BASE: Record<string, { type: string; base: number; severity: PhotoAnalysisSeverity }> = {
  pipe_burst: { type: "Rohrbruch", base: 7200, severity: "high" },
  appliance_leak: { type: "Geräte-Leckage", base: 2800, severity: "medium" },
  human_error: { type: "Bedienungsfehler / Überlauf", base: 2200, severity: "low" },
  roof_leak: { type: "Dachleck", base: 8500, severity: "high" },
  unknown: { type: "Unklarer Wasserschaden", base: 4500, severity: "medium" },
}

const VISION_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])
const VISION_TIMEOUT_MS = 25_000
const MAX_B64_CHARS = 5_500_000

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
}

function clampAmount(n: number): number {
  return Math.max(500, Math.min(125_000, Math.round(n / 50) * 50))
}

function severityRank(s: PhotoAnalysisSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s]
}

function maxSeverity(a: PhotoAnalysisSeverity, b: PhotoAnalysisSeverity): PhotoAnalysisSeverity {
  return severityRank(a) >= severityRank(b) ? a : b
}

function severityLabel(s: PhotoAnalysisSeverity): string {
  return { low: "gering", medium: "mittel", high: "hoch", critical: "kritisch" }[s]
}

function resolveVisionMime(mimeType?: string | null): string | null {
  if (!mimeType) return "image/jpeg"
  const normalized = mimeType.toLowerCase().split(";")[0]?.trim() ?? ""
  if (normalized === "image/jpg") return "image/jpeg"
  if (VISION_MIME.has(normalized)) return normalized
  return null
}

function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Models sometimes wrap JSON in markdown fences
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim())
      } catch {
        // fall through
      }
    }
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function parseVisionPayload(
  parsed: Record<string, unknown>,
  model: string
): PhotoAnalysisResult | null {
  const severityRaw = String(parsed.severity ?? "medium")
  const severity = (["low", "medium", "high", "critical"] as const).includes(
    severityRaw as PhotoAnalysisSeverity
  )
    ? (severityRaw as PhotoAnalysisSeverity)
    : "medium"

  const amountRaw = Number(parsed.suggested_amount_eur)
  if (!Number.isFinite(amountRaw)) return null
  const amount = clampAmount(amountRaw)
  const confidence = Math.max(
    0.35,
    Math.min(0.95, Number(parsed.confidence) || 0.7)
  )
  const damageType = String(parsed.damage_type ?? "Wasserschaden").slice(0, 120)
  const roomHint = parsed.room_hint != null && String(parsed.room_hint).trim()
    ? String(parsed.room_hint).slice(0, 80)
    : null
  const summary =
    typeof parsed.summary_de === "string" && parsed.summary_de.trim()
      ? parsed.summary_de.slice(0, 400)
      : `KI-Einschätzung: ca. ${amount.toLocaleString("de-DE")} €.`

  const signals = Array.isArray(parsed.signals)
    ? parsed.signals.map((s) => String(s).slice(0, 80)).slice(0, 8)
    : ["vision"]

  return {
    version: 1,
    source: "vision",
    model,
    analyzed_at: new Date().toISOString(),
    damage_type: damageType,
    severity,
    suggested_amount_eur: amount,
    confidence,
    room_hint: roomHint,
    summary_de: summary,
    signals,
  }
}

/**
 * Rule-based water-damage estimate from filename + claim context.
 * Always available (no external API). Vision can override when keyed.
 */
export function analyzeDamagePhotoHeuristic(input: AnalyzePhotoInput): PhotoAnalysisResult {
  const haystack = normalize(
    [input.fileName, input.claimDescription ?? "", input.claimCategory ?? ""].join(" ")
  )
  const signals: string[] = []

  const category = input.claimCategory && CATEGORY_BASE[input.claimCategory]
    ? CATEGORY_BASE[input.claimCategory]
    : CATEGORY_BASE.unknown

  let amount = category.base
  let damageType = category.type
  let severity: PhotoAnalysisSeverity = category.severity
  let roomHint: string | null = null
  let confidence = 0.42

  for (const room of ROOM_KEYWORDS) {
    if (room.keys.some((k) => haystack.includes(normalize(k)))) {
      roomHint = room.room
      amount = (amount + room.base) / 2
      signals.push(`Raumhinweis: ${room.room}`)
      confidence += 0.08
      break
    }
  }

  for (const dmg of DAMAGE_KEYWORDS) {
    if (dmg.keys.some((k) => haystack.includes(normalize(k)))) {
      damageType = dmg.type
      severity = maxSeverity(severity, dmg.severity)
      amount *= dmg.mult
      signals.push(`Schadensignal: ${dmg.type}`)
      confidence += 0.1
      break
    }
  }

  if (input.fileSizeBytes && input.fileSizeBytes > 2_500_000) {
    amount *= 1.08
    signals.push("Hochauflösendes Foto (Detailtiefe)")
    confidence += 0.03
  }

  if (!signals.length) {
    signals.push("Allgemeine Wasserschaden-Heuristik ohne starke Datei-Signale")
  }

  amount = clampAmount(amount)
  confidence = Math.max(0.25, Math.min(0.78, confidence))

  const roomPart = roomHint ? ` im Bereich ${roomHint}` : ""
  const summary_de =
    `${damageType}${roomPart}: System-Einschätzung ca. ${amount.toLocaleString("de-DE")} € ` +
    `(Schweregrad ${severityLabel(severity)}).`

  return {
    version: 1,
    source: "heuristic",
    model: "hydra-heuristic-v1",
    analyzed_at: new Date().toISOString(),
    damage_type: damageType,
    severity,
    suggested_amount_eur: amount,
    confidence,
    room_hint: roomHint,
    summary_de,
    signals,
  }
}

/**
 * Optional OpenAI-compatible vision call. Uses native fetch (no new packages).
 * Returns null on any failure — caller MUST fall back to heuristic.
 */
export async function analyzeDamagePhotoVision(
  input: AnalyzePhotoInput
): Promise<PhotoAnalysisResult | null> {
  try {
    if (!env.photoAiEnabled()) return null

    const apiKey = env.openaiApiKey()
    if (!apiKey) return null

    if (!input.imageBytes || input.imageBytes.byteLength < 100) return null

    const mime = resolveVisionMime(input.mimeType)
    if (!mime) return null

    const b64 = Buffer.from(input.imageBytes).toString("base64")
    if (b64.length > MAX_B64_CHARS) {
      console.error("[analyzeDamagePhotoVision] payload_too_large")
      return null
    }

    const model = env.openaiVisionModel()
    const prompt = `Du bist Sachverständiger für Leitungswasserschäden in Deutschland.
Analysiere das Schadenfoto. Antworte NUR mit JSON:
{"damage_type":string,"severity":"low"|"medium"|"high"|"critical","suggested_amount_eur":number,"confidence":number,"room_hint":string|null,"summary_de":string,"signals":string[]}
Beträge realistisch für DE Sanierung/Trocknung (500-125000). summary_de auf Deutsch, kurz.`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: `data:${mime};base64,${b64}` },
                },
              ],
            },
          ],
        }),
      })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      console.error("[analyzeDamagePhotoVision] http", res.status)
      return null
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = json.choices?.[0]?.message?.content
    if (!raw || typeof raw !== "string") {
      console.error("[analyzeDamagePhotoVision] empty_content")
      return null
    }

    const parsed = extractJsonObject(raw)
    if (!parsed || typeof parsed !== "object") {
      console.error("[analyzeDamagePhotoVision] invalid_json")
      return null
    }

    const result = parseVisionPayload(parsed as Record<string, unknown>, model)
    if (!result) {
      console.error("[analyzeDamagePhotoVision] invalid_payload")
      return null
    }
    return result
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error"
    console.error("[analyzeDamagePhotoVision] failed", name)
    return null
  }
}

/** True when Vision can be attempted (key present and not disabled). */
export function isVisionAnalysisConfigured(): boolean {
  return env.photoAiEnabled() && Boolean(env.openaiApiKey())
}

/**
 * Prefer Vision when configured; always fall back to heuristic on any failure.
 * Never throws.
 */
export async function analyzeDamagePhoto(
  input: AnalyzePhotoInput
): Promise<PhotoAnalysisResult> {
  try {
    const vision = await analyzeDamagePhotoVision(input)
    if (vision) return vision
  } catch {
    console.error("[analyzeDamagePhoto] vision_unexpected")
  }
  return analyzeDamagePhotoHeuristic(input)
}
