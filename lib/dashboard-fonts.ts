import {
  Atma,
  Baloo_2,
  Balsamiq_Sans,
  Chewy,
  Comic_Neue,
  Comfortaa,
  Delius,
  Fredoka,
  Geist,
  Patrick_Hand,
} from "next/font/google";
import type { DashboardFontId } from "@/lib/dashboard-font-options";

const geist = Geist({ subsets: ["latin"] });
const fredoka = Fredoka({ subsets: ["latin"] });
const baloo2 = Baloo_2({ subsets: ["latin"] });
const patrickHand = Patrick_Hand({ subsets: ["latin"], weight: "400" });
const comicNeue = Comic_Neue({ subsets: ["latin"], weight: "400" });
const balsamiqSans = Balsamiq_Sans({ subsets: ["latin"], weight: "400" });
const chewy = Chewy({ subsets: ["latin"], weight: "400" });
const delius = Delius({ subsets: ["latin"], weight: "400" });
const comfortaa = Comfortaa({ subsets: ["latin"] });
const atma = Atma({ subsets: ["latin"], weight: "400" });

const dashboardFontClassById: Record<DashboardFontId, string> = {
  geist: geist.className,
  fredoka: fredoka.className,
  baloo2: baloo2.className,
  patrickhand: patrickHand.className,
  comicneue: comicNeue.className,
  balsamiqsans: balsamiqSans.className,
  chewy: chewy.className,
  delius: delius.className,
  comfortaa: comfortaa.className,
  atmakrishnan: atma.className,
};

export function getDashboardFontClassName(fontId: DashboardFontId): string {
  return dashboardFontClassById[fontId];
}
