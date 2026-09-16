import { draftFromProfile } from "@/lib/onboarding/persist";
import {
  computeProfileReadiness,
  sharedPreferenceText,
  type ProfileReadiness,
} from "@/lib/onboarding/readiness";
import type { OnboardingDraft } from "@/lib/onboarding/schema";
import { countReceivedLikes, listReceivedLikes } from "./likes";
import { countAcceptedConnections, listAcceptedConnections, listPendingRequests, listSentInterestReceiverIds } from "./matches";
import { listChatsForUser, unreadMessageCount } from "./chats";
import { getProfile, listProfiles, listProfilesByIds } from "./profiles";
import type { Profile } from "./types";

export type CountResult = { status: "ok"; value: number } | { status: "error"; message: string };

export type DiscoveryPerson = {
  id: string;
  displayName: string;
  photoURL: string;
  age?: number;
  profession: string;
  location: string;
  isVerified: boolean;
  sharedPreference: string | null;
};

export type DiscoveryResult =
  | { status: "unpublished" }
  | { status: "ok"; people: DiscoveryPerson[] }
  | { status: "empty" }
  | { status: "error"; message: string };

export type ActivityItem = {
  id: string;
  type: "interest" | "connection" | "message";
  title: string;
  href: string;
  at: number;
};

export type DashboardOverviewData = {
  profile: Profile;
  draft: OnboardingDraft;
  readiness: ProfileReadiness;
  receivedInterests: CountResult;
  connections: CountResult;
  unreadMessages: CountResult;
  pendingRequests: CountResult;
  discovery: DiscoveryResult;
  recent: { status: "ok"; items: ActivityItem[] } | { status: "error"; message: string };
};

function settledNumber(result: PromiseSettledResult<number>): CountResult {
  if (result.status === "fulfilled") return { status: "ok", value: result.value };
  return {
    status: "error",
    message: result.reason instanceof Error ? result.reason.message : "Could not load this count.",
  };
}

function mapDiscoveryPerson(profile: Profile, self: Profile): DiscoveryPerson {
  return {
    id: profile.id,
    displayName: profile.displayName || "Member",
    photoURL: profile.photoURL || "",
    age: profile.ageYears,
    profession: profile.profession || "",
    location: profile.location || profile.country || "",
    isVerified: Boolean(profile.isVerified),
    sharedPreference: sharedPreferenceText(
      { languages: self.languages, country: self.country },
      { languages: profile.languages, country: profile.country }
    ),
  };
}

export async function loadDashboardOverview(userId: string): Promise<DashboardOverviewData> {
  const profile = await getProfile(userId);
  if (!profile) {
    throw new Error("We could not load your profile.");
  }

  const draft = draftFromProfile(profile);
  const readiness = computeProfileReadiness(draft, Boolean(profile.isPublished));

  const likesTask = countReceivedLikes(userId);
  const connectionsTask = countAcceptedConnections(userId);
  const chatsTask = listChatsForUser(userId);
  const pendingTask = listPendingRequests(userId);
  const sentInterestIdsTask = listSentInterestReceiverIds(userId);
  const discoveryTask = profile.isPublished
    ? listProfiles({ limit: 24, excludeId: userId })
    : Promise.resolve(null);
  const recentLikesTask = listReceivedLikes(userId, 8);
  const acceptedTask = listAcceptedConnections(userId);

  const [
    likesResult,
    connectionsResult,
    chatsResult,
    pendingResult,
    sentInterestResult,
    discoveryResult,
    recentLikesResult,
    acceptedResult,
  ] = await Promise.allSettled([
    likesTask,
    connectionsTask,
    chatsTask,
    pendingTask,
    sentInterestIdsTask,
    discoveryTask,
    recentLikesTask,
    acceptedTask,
  ]);

  const receivedInterests = settledNumber(likesResult);
  const connections = settledNumber(connectionsResult);

  let unreadMessages: CountResult;
  if (chatsResult.status === "fulfilled") {
    unreadMessages = { status: "ok", value: unreadMessageCount(chatsResult.value, userId) };
  } else {
    unreadMessages = {
      status: "error",
      message:
        chatsResult.reason instanceof Error ? chatsResult.reason.message : "Could not load messages.",
    };
  }

  const pendingRequests: CountResult =
    pendingResult.status === "fulfilled"
      ? { status: "ok", value: pendingResult.value.length }
      : {
          status: "error",
          message:
            pendingResult.reason instanceof Error
              ? pendingResult.reason.message
              : "Could not load requests.",
        };

  const alreadySent = new Set(
    sentInterestResult.status === "fulfilled" ? sentInterestResult.value : []
  );

  let discovery: DiscoveryResult;
  if (!profile.isPublished) {
    discovery = { status: "unpublished" };
  } else if (discoveryResult.status === "rejected") {
    discovery = {
      status: "error",
      message:
        discoveryResult.reason instanceof Error
          ? discoveryResult.reason.message
          : "Discovery is unavailable right now.",
    };
  } else {
    const candidates = (discoveryResult.value || [])
      .filter((person) => !alreadySent.has(person.id))
      .slice(0, 6)
      .map((person) => mapDiscoveryPerson(person, profile));
    discovery =
      candidates.length > 0
        ? { status: "ok", people: candidates }
        : { status: "empty" };
  }

  let recent: DashboardOverviewData["recent"];
  try {
    if (recentLikesResult.status === "rejected" && acceptedResult.status === "rejected" && chatsResult.status === "rejected") {
      throw new Error("Could not load recent activity.");
    }

    const items: ActivityItem[] = [];
    const likes = recentLikesResult.status === "fulfilled" ? recentLikesResult.value : [];
    const accepted = acceptedResult.status === "fulfilled" ? acceptedResult.value : [];
    const chats = chatsResult.status === "fulfilled" ? chatsResult.value : [];
    const pending = pendingResult.status === "fulfilled" ? pendingResult.value : [];

    const relatedIds = [
      ...likes.map((like) => like.likerId),
      ...accepted.map((row) => (row.senderUid === userId ? row.receiverUid : row.senderUid)),
      ...pending.map((row) => row.senderUid),
    ];
    const relatedProfiles = await listProfilesByIds(relatedIds);
    const names = new Map(relatedProfiles.map((row) => [row.id, row.displayName || "Member"]));

    for (const like of likes) {
      items.push({
        id: `like-${like.likerId}`,
        type: "interest",
        title: `${names.get(like.likerId) || "A member"} expressed interest`,
        href: "/dashboard/interests",
        at: like.createdAt ? Date.parse(like.createdAt) : 0,
      });
    }
    for (const row of accepted.slice(0, 8)) {
      const otherId = row.senderUid === userId ? row.receiverUid : row.senderUid;
      items.push({
        id: `match-${row.id}`,
        type: "connection",
        title: `You connected with ${names.get(otherId) || "a member"}`,
        href: "/messages",
        at: row.updatedAt?.toMillis() || row.createdAt?.toMillis() || 0,
      });
    }
    for (const row of pending.slice(0, 5)) {
      items.push({
        id: `pending-${row.id}`,
        type: "connection",
        title: `${names.get(row.senderUid) || "A member"} sent a connection request`,
        href: "/messages",
        at: row.createdAt?.toMillis() || 0,
      });
    }
    for (const chat of chats.filter((item) => Number(item.unreadBy?.[userId] || 0) > 0).slice(0, 5)) {
      const otherId = chat.participants.find((id) => id !== userId);
      const otherName =
        (otherId && chat.participantDetails?.[otherId]?.displayName) ||
        (otherId && names.get(otherId)) ||
        "a connection";
      items.push({
        id: `chat-${chat.id}`,
        type: "message",
        title: `Unread message from ${otherName}`,
        href: `/messages/${chat.id}`,
        at: chat.lastMessageTimestamp?.toMillis() || 0,
      });
    }

    items.sort((a, b) => b.at - a.at);
    recent = { status: "ok", items: items.slice(0, 8) };
  } catch (error) {
    recent = {
      status: "error",
      message: error instanceof Error ? error.message : "Could not load recent activity.",
    };
  }

  return {
    profile,
    draft,
    readiness,
    receivedInterests,
    connections,
    unreadMessages,
    pendingRequests,
    discovery,
    recent,
  };
}

export function unreadNotificationCount(data: DashboardOverviewData): number | null {
  const parts = [data.unreadMessages, data.pendingRequests];
  if (parts.some((part) => part.status === "error")) return null;
  return parts.reduce((sum, part) => sum + (part.status === "ok" ? part.value : 0), 0);
}
