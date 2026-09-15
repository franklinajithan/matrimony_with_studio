export { supabase, isSupabaseConfigured } from "./client";
export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signOutToLanding,
  sendPasswordResetEmail,
  updatePassword,
  resendSignupConfirmation,
  updateProfile,
} from "./auth";
export type { AuthUser, User } from "./auth";
export { Timestamp, serverTimestamp } from "./timestamp";
export {
  getProfile,
  listProfiles,
  listProfilesByIds,
  searchProfiles,
  createUserProfile,
  updateUserProfile,
  setProfilePublished,
  updateAllUsersSearchTerms,
  subscribeToProfiles,
  mapProfile,
} from "./profiles";
export { uploadFile, uploadMediaFile, resolveMediaUrl, mediaPathForUser } from "./storage";
export {
  hasLiked,
  getLikedIds,
  likeProfile,
  unlikeProfile,
  subscribeToLike,
  countReceivedLikes,
  listReceivedLikes,
  listSentLikes,
} from "./likes";
export {
  getMatchRequest,
  createMatchRequest,
  updateMatchRequestStatus,
  deleteMatchRequest,
  subscribeToMatchRequest,
  subscribeToPendingRequests,
  listPendingRequests,
  countPendingRequests,
  listAcceptedConnections,
  countAcceptedConnections,
  countRecentAcceptedConnections,
} from "./matches";
export {
  getChat,
  listChatsForUser,
  unreadMessageCount,
  countUnreadMessages,
  createChatDocument,
  updateChatParticipantDetails,
  clearUnread,
  listMessages,
  sendMessage,
  markMessagesRead,
  subscribeToChats,
  subscribeToMessages,
} from "./chats";
export {
  getPost,
  listPosts,
  createPost,
  togglePostLike,
  addPostComment,
  markPostCommentsRead,
  countUnreadLikedPosts,
  countUnreadCommentedPosts,
  subscribeToPosts,
} from "./posts";
export { createSuccessStory, subscribeToSuccessStories } from "./stories";
export {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  duplicateDocument,
  deleteDocument,
  listFavouriteTemplates,
  setFavouriteTemplate,
  createShareLink,
  revokeShareLink,
  getShareByToken,
} from "./biodata";
