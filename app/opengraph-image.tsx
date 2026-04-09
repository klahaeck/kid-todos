import { brandOgImageResponse } from "@/lib/brand-og-image";

export const alt =
  "StarrySteps — routine management for kids and families";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default async function Image() {
  return brandOgImageResponse();
}
