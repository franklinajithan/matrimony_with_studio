import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: user.id });
}
