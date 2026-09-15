"use client";

import React, { createContext, useContext } from "react";

type DashboardChromeValue = {
  /** Update the unread-messages badge (e.g. after opening a chat). */
  setUnread: (count: number | null) => void;
  /** Update the pending-interests badge (e.g. after accept/decline). */
  setInterestsCount: (count: number) => void;
  /** Clear the new-connections badge (e.g. after visiting Connections). */
  clearConnectionsBadge: () => void;
  /** Re-fetch all header/nav badge counts from the server. */
  refreshBadges: () => void;
};

const DashboardChromeContext = createContext<DashboardChromeValue>({
  setUnread: () => {},
  setInterestsCount: () => {},
  clearConnectionsBadge: () => {},
  refreshBadges: () => {},
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
