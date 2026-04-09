import { ImageResponse } from "next/og";

const DESCRIPTION =
  "Turn daily routines into calm, positive moments — morning and evening flows kids can follow.";

/** Match homepage hero wordmark (`app/page.tsx`: `text-brand-grape` + `text-brand-coral`). */
const BRAND_GRAPE = "#6d28d9";
const BRAND_CORAL = "#ff5c33";

/** gstatic TTF files for Nunito v32 (matches Google Fonts CSS for wght@500;600;700;800). */
const NUNITO_BASE = "https://fonts.gstatic.com/s/nunito/v32";

const NUNITO_FILES = [
  { weight: 500 as const, file: "XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhRTM.ttf" },
  { weight: 600 as const, file: "XRXI3I6Li01BKofiOc5wtlZ2di8HDGUmRTM.ttf" },
  { weight: 700 as const, file: "XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmRTM.ttf" },
  { weight: 800 as const, file: "XRXI3I6Li01BKofiOc5wtlZ2di8HDDsmRTM.ttf" },
] as const;

async function loadNunitoFonts() {
  return Promise.all(
    NUNITO_FILES.map(async ({ weight, file }) => {
      const res = await fetch(`${NUNITO_BASE}/${file}`);
      if (!res.ok) {
        throw new Error(`Failed to load Nunito ${weight}: ${res.status}`);
      }
      const data = await res.arrayBuffer();
      return {
        name: "Nunito",
        data,
        style: "normal" as const,
        weight,
      };
    }),
  );
}

export async function brandOgImageResponse(): Promise<ImageResponse> {
  const fonts = await loadNunitoFonts();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF6E8 0%, #C9B8F5 45%, #6FAFEA 100%)",
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 48,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#243B6B",
              marginBottom: 20,
              letterSpacing: 0.5,
            }}
          >
            Morning & evening routines
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.05,
            }}
          >
            <span style={{ color: BRAND_GRAPE }}>Starry</span>
            <span style={{ color: BRAND_CORAL }}>Steps</span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#18253F",
              marginTop: 28,
              textAlign: "center",
              lineHeight: 1.35,
              opacity: 0.92,
            }}
          >
            {DESCRIPTION}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginTop: 44,
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#F6C85F",
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#8ED9C4",
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#F6C85F",
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#8ED9C4",
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#F6C85F",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    },
  );
}
