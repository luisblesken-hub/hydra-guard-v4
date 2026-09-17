import { LandingContent } from "./content";
import { LandingFooter } from "./footer";
import { LandingHeader } from "./header";
import { LandingHero } from "./hero";

export function PublicLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-hg-canvas">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-hg-ink"
      >
        Zum Inhalt
      </a>
      <LandingHeader />
      <LandingHero />
      <main>
        <LandingContent />
      </main>
      <LandingFooter />
    </div>
  );
}
