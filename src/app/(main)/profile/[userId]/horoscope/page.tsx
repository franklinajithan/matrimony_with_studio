"use client";
import { useParams } from "next/navigation";
import HoroscopeStudio from "@/components/horoscope/HoroscopeStudio";
export default function MemberHoroscopePage() {
  const { userId } = useParams<{ userId: string }>();
  return <HoroscopeStudio member={userId} />;
}
