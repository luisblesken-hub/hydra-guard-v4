import { redirect } from "next/navigation";

// Placeholder until role-specific sanierer flows are implemented.
export default function SaniererDashboardPage() {
  redirect("/dashboard/owner");
}

