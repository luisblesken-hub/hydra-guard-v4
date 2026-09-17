import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return (
    process.env.CLAIM_TRACKING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "hydra-dev-tracking-secret"
  );
}

/** Opaque public tracking token (no DB column required). Valid ~90 days. */
export function createClaimTrackingToken(reportId: string): string {
  const exp = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const body = `${reportId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("hex").slice(0, 32);
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

export function verifyClaimTrackingToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [reportId, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!reportId || !Number.isFinite(exp) || Date.now() > exp) return null;

    const body = `${reportId}.${expStr}`;
    const expect = createHmac("sha256", secret()).update(body).digest("hex").slice(0, 32);
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return reportId;
  } catch {
    return null;
  }
}
