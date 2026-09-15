"use client";

import React, { createContext, useContext } from "react";

type DashboardChromeValue = {
  setUnread: (count: number | null) => void;
};

const DashboardChromeContext = createContext<DashboardChromeValue>({
  setUnread: () => {},
});

export function DashboardChromeProvider({
  value,
  children,
}: {
  value: DashboardChromeValue;
  children: React.ReactNode;
}) {
  return <DashboardChromeContext.Provider value={value}>{children}</DashboardChromeContext.Provider>;
}

export function useDashboardChrome() {
  return useContext(DashboardChromeContext);
}
