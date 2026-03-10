// Hydra Guard V4 – Business Logic Helper
// Implementierungen basieren auf _SATELLITE_LAB/hydra-guard-core/business_logic_vault.md.

export function computeDegressivePrice(
  x: number,
  P_basis: number,
  locationIndex: number,
  k: number,
  R_hybrid: number
): number {
  if (x < 0) x = 0;
  if (P_basis <= 0) throw new Error("P_basis must be > 0");
  if (locationIndex <= 0) throw new Error("locationIndex must be > 0");
  if (k <= 0) throw new Error("k must be > 0");
  if (R_hybrid < 0) throw new Error("R_hybrid must be >= 0");

  const variablePart = x * (P_basis * locationIndex * Math.exp(-k * x));
  return variablePart + R_hybrid;
}

export function computeNashSplit(
  A_sys: number,
  A_san: number
): {
  deviationPercent: number;
  withinBand: boolean;
  nashSplitCompliance?: number;
  nashSplitSanitizer?: number;
} {
  if (A_sys <= 0) {
    throw new Error("system_suggestion_amount (A_sys) must be > 0");
  }

  const deviationPercent = (Math.abs(A_san - A_sys) / A_sys) * 100;

  if (deviationPercent <= 12) {
    return {
      deviationPercent,
      withinBand: true,
    };
  }

  const nashSplitCompliance = 0.6 * A_sys + 0.4 * A_san;
  const nashSplitSanitizer = 0.4 * A_sys + 0.6 * A_san;

  return {
    deviationPercent,
    withinBand: false,
    nashSplitCompliance,
    nashSplitSanitizer,
  };
}

export function computeRegieSharePercent(grossAmount: number): number {
  if (grossAmount < 0) {
    throw new Error("grossAmount must be >= 0");
  }

  if (grossAmount < 2500) {
    return 7;
  }

  return 12;
}

