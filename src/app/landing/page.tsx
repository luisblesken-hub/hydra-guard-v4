import { PublicLanding } from "@/components/landing/public-landing";

/** Public marketing page — no auth redirect (use when logged in on `/`). */
export default function LandingPage() {
  return <PublicLanding />;
}
