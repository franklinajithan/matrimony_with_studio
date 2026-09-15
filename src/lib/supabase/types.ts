import type { Timestamp } from "./timestamp";

export type StoredPhoto = {
  id: string;
  url: string;
  hint: string;
  storagePath?: string;
};

export type Profile = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string;
  bio: string;
  photoURL: string;
  dataAiHint: string;
  location: string;
  profession: string;
  height: string;
  dob: string;
  ageYears?: number;
  isPublished?: boolean;
  onboardingStep?: number;
  onboardingDraft?: Record<string, unknown>;
  country?: string;
  region?: string;
  languages?: string[];
  relationshipIntentions?: Record<string, unknown>;
  valuesLifestyle?: Record<string, unknown>;
  culturalFamily?: Record<string, unknown>;
  settlement?: Record<string, unknown>;
  photoPrivacy?: "members" | "connections" | "hidden";
  religion: string;
  caste: string;
  language: string;
  hobbies: string;
  favoriteMovies: string;
  favoriteMusic: string;
  educationLevel: string;
  smokingHabits: string;
  drinkingHabits: string;
  sunSign: string;
  moonSign: string;
  nakshatra: string;
  horoscopeInfo: string;
  horoscopeFileName: string;
  horoscopeFileUrl: string;
  additionalPhotoUrls: StoredPhoto[];
  isAdmin: boolean;
  isVerified: boolean;
  lastSeenLikeNotificationsTimestamp: Timestamp | null;
  lastSeenCommentNotificationsTimestamp: Timestamp | null;
  commentNotifications: Record<string, { count: number; lastSeen: Timestamp | null }>;
  extra: Record<string, unknown>;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type MatchRequestRow = {
  id: string;
  senderUid: string;
  receiverUid: string;
  status: "pending" | "accepted" | "declined_by_sender" | "declined_by_receiver";
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ChatRow = {
  id: string;
  participants: string[];
  participantDetails: Record<
    string,
    { displayName: string; photoURL: string; dataAiHint?: string }
  >;
  lastMessageText: string;
  lastMessageSenderId: string | null;
  lastMessageTimestamp: Timestamp | null;
  unreadBy: Record<string, number>;
  createdAt: Timestamp | null;
};

export type MessageRow = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  timestamp: Timestamp | null;
};

export type PostComment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Timestamp | Date;
  isRead?: boolean;
};

export type PostRow = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  likedBy: string[];
  comments: number;
  commentList: PostComment[];
  lastLikedAt: Timestamp | null;
  lastCommentedAt: Timestamp | null;
  commentNotifications: Record<string, { count: number; lastSeen: Timestamp | null }>;
  timestamp: Timestamp | null;
};

export type SuccessStoryRow = {
  id: string;
  coupleNames: string;
  storyText: string;
  originalStoryText: string | null;
  photoUrl: string | null;
  photoStoragePath: string | null;
  contactEmail: string | null;
  submittedByUid: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  submittedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  approvedAt: Timestamp | null;
};
