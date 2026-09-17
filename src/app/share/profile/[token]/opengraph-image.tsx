import { ImageResponse } from "next/og";
import { resolveSharedProfile } from "@/lib/supabase/profile-share";

export const runtime = "edge";
export const alt = "CupidMatch shared profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoUrl = "https://matrimony-with-studio.vercel.app/images/cupidmatch-logo.png";

type Props = { params: Promise<{ token: string }> };

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "Member";
}

export default async function Image({ params }: Props) {
  const { token } = await params;
  const shared = await resolveSharedProfile(token);

  // Invalid / expired / revoked / unpublished → generic brand card only (no member PII).
  if (!shared) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#fff9fb,#f5edff)",
            fontFamily: "Arial, sans-serif",
            padding: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              borderRadius: 38,
              background: "rgba(255,255,255,.94)",
              border: "2px solid #eadcff",
              padding: 48,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt=""
              width="360"
              height="105"
              style={{ width: 360, height: 105, objectFit: "contain" }}
            />
            <div
              style={{
                marginTop: 28,
                fontSize: 42,
                fontWeight: 700,
                color: "#351532",
                display: "flex",
                textAlign: "center",
              }}
            >
              This shared profile link has expired.
            </div>
            <div style={{ marginTop: 16, fontSize: 24, color: "#745d70", display: "flex" }}>
              Visit CupidMatch to continue
            </div>
          </div>
        </div>
      ),
      size
    );
  }

  const name = firstName(shared.displayName);
  const subtitle = [shared.age ? String(shared.age) : null, shared.profession, shared.location]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg,#fff9fb,#f5edff)",
          fontFamily: "Arial, sans-serif",
          padding: 64,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            borderRadius: 38,
            background: "rgba(255,255,255,.92)",
            border: "2px solid #eadcff",
            boxShadow: "0 20px 60px rgba(75,35,110,.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 410,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(160deg,#efe2ff,#ffe8ef)",
            }}
          >
            {shared.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shared.photoURL}
                alt=""
                width="310"
                height="390"
                style={{
                  width: 310,
                  height: 390,
                  objectFit: "cover",
                  borderRadius: 28,
                  boxShadow: "0 14px 40px rgba(0,0,0,.16)",
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                width="310"
                height="250"
                style={{ width: 310, height: 250, objectFit: "contain" }}
              />
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "48px 64px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt=""
              width="330"
              height="96"
              style={{
                width: 330,
                height: 96,
                objectFit: "contain",
                objectPosition: "left center",
              }}
            />
            <div
              style={{
                marginTop: 22,
                fontSize: 58,
                lineHeight: 1.08,
                color: "#24152f",
                fontWeight: 800,
                display: "flex",
              }}
            >
              {name}
            </div>
            {subtitle ? (
              <div style={{ marginTop: 16, fontSize: 26, color: "#6b6070", display: "flex" }}>
                {subtitle}
              </div>
            ) : null}
            <div style={{ marginTop: 28, fontSize: 22, color: "#8a7d91", display: "flex" }}>
              Shared temporarily on CupidMatch
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
