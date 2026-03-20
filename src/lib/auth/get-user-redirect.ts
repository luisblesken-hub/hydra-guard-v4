const ROLE_PATHS: Record<string, string> = {
  owner: "/dashboard/owner",
  sanierer: "/dashboard/sanierer",
  insurance_agent: "/dashboard/insurance",
  insurer_admin: "/dashboard/insurer",
  super_admin: "/dashboard/admin",
  versicherung: "/dashboard/insurance",
  mieter: "/dashboard/owner",
};

export function getUserRedirect(role: string | null | undefined): string {
  if (!role) return "/dashboard";
  return ROLE_PATHS[role] ?? "/dashboard";
}

