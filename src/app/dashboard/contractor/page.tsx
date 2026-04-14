import { redirect } from "next/navigation";

// Contractor = Sanierer im HydraGuard-System (gleiche Rolle, einheitliches Dashboard).
export default function ContractorDashboardPage() {
  redirect("/dashboard/sanierer");
}
