export { supabase, isSupabaseConfigured } from "./client";
export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "./auth";
export type { AuthUser, User } from "./auth";
export { Timestamp, serverTimestamp } from "./timestamp";
export {
  getProfile,
  listProfiles,
  searchProfiles,
  createUserProfile,
  updateUserProfile,
  updateAllUsersSearchTerms,
  subscribeToProfiles,
  mapProfile,
} from "./profiles";
export { uploadFile } from "./storage";
export { hasLiked, getLikedIds, likeProfile, unlikeProfile, subscribeToLike } from "./likes";
export {
  getMatchRequest,
  createMatchRequest,
  updateMatchRequestStatus,
  deleteMatchRequest,
  subscribeToMatchRequest,
  subscribeToPendingRequests,
} from "./matches";
export {
  getChat,
  listChatsForUser,
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
