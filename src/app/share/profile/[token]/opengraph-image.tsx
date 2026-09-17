import { ImageResponse } from "next/og";
import { resolveSharedProfile } from "@/lib/supabase/profile-share";

export const runtime = "edge";
export const alt = "CupidMatch shared profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoUrl = "https://matrimony-with-studio.vercel.app/images/cupidmatch-logo.png";
type Props = { params: Promise<{ token: string }> };
function firstName(displayName: string) { return displayName.trim().split(/\s+/)[0] || "Member"; }

export default async function Image({ params }: Props) {
  const { token } = await params;
  const shared = await resolveSharedProfile(token);
  if (!shared) return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#fff9fb,#f5edff)", fontFamily: "Arial, sans-serif", padding: 64 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", borderRadius: 38, background: "white", border: "2px solid #eadcff" }}>
        <img src={logoUrl} alt="" width="340" height="100" style={{ width: 340, height: 100, objectFit: "contain" }}/>
        <div style={{ marginTop: 28, fontSize: 42, fontWeight: 700, color: "#351532", display: "flex" }}>This shared profile link has expired.</div>
        <div style={{ marginTop: 16, fontSize: 24, color: "#745d70", display: "flex" }}>For privacy, CupidMatch share links last 2 days.</div>
      </div>
    </div>, size
  );

  const name = firstName(shared.displayName);
  const subtitle = [shared.age ? String(shared.age) : null, shared.profession, shared.location].filter(Boolean).join(" · ");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(135deg,#fff9fb,#f5edff)", fontFamily: "Arial, sans-serif", padding: 48 }}>
      <div style={{ display: "flex", width: "100%", height: "100%", borderRadius: 38, background: "white", border: "2px solid #eadcff", overflow: "hidden" }}>
        <div style={{ width: 470, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#efe2ff,#ffe8ef)", padding: 32 }}>
          {shared.photoURL ? <img src={shared.photoURL} alt="" width="390" height="470" style={{ width: 390, height: 470, objectFit: "cover", borderRadius: 28 }}/>
            : <div style={{ width: 300, height: 300, borderRadius: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "#eee6ff", fontSize: 100, fontWeight: 800, color: "#7027e8" }}>{name.slice(0,1).toUpperCase()}</div>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "54px 64px" }}>
          <div style={{ fontSize: 22, color: "#8d5b84", fontWeight: 700, display: "flex", textTransform: "uppercase", letterSpacing: 2 }}>Shared with you</div>
          <div style={{ marginTop: 18, fontSize: 62, lineHeight: 1.05, color: "#24152f", fontWeight: 800, display: "flex" }}>{name}</div>
          {subtitle ? <div style={{ marginTop: 18, fontSize: 27, color: "#6b6070", display: "flex", lineHeight: 1.35 }}>{subtitle}</div> : null}
          <div style={{ marginTop: 30, fontSize: 21, color: "#8a7d91", display: "flex" }}>Private profile link · valid for 2 days</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 72, bottom: 66, display: "flex", alignItems: "center", borderRadius: 16, background: "rgba(255,255,255,.96)", padding: "8px 14px", boxShadow: "0 6px 20px rgba(0,0,0,.12)" }}>
        <img src={logoUrl} alt="" width="190" height="55" style={{ width: 190, height: 55, objectFit: "contain" }}/>
      </div>
    </div>, size
  );
}