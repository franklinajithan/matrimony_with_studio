"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageCode = "en" | "ta" | "si" | "fr" | "nl" | "de";
export const LANGUAGES: Record<LanguageCode,string> = { en:"English", ta:"தமிழ்", si:"සිංහල", fr:"Français", nl:"Nederlands", de:"Deutsch" };

type I18nValue={language:LanguageCode;setLanguage:(l:LanguageCode)=>void};
const I18nContext=createContext<I18nValue>({language:"en",setLanguage:()=>{}});
export function I18nProvider({children}:{children:React.ReactNode}){
 const [language,setLanguageState]=useState<LanguageCode>("en");
 useEffect(()=>{const v=localStorage.getItem("cupidmatch-language") as LanguageCode|null;if(v&&v in LANGUAGES)setLanguageState(v)},[]);
 const setLanguage=(v:LanguageCode)=>{setLanguageState(v);localStorage.setItem("cupidmatch-language",v);document.cookie=`cupidmatch-language=${v}; Path=/; Max-Age=31536000; SameSite=Lax`;document.documentElement.lang=v};
 useEffect(()=>{document.documentElement.lang=language},[language]);
 return <I18nContext.Provider value={{language,setLanguage}}>{children}</I18nContext.Provider>;
}
export const useI18n=()=>useContext(I18nContext);
