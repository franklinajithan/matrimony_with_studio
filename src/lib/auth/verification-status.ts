type AuthEvidence = {
  email?: string | null;
  email_confirmed_at?: string | null;
  phone?: string | null;
  phone_confirmed_at?: string | null;
};

type ReviewEvidence = { status: string; reviewed_at: string | null } | null;

export function verificationStatus(auth: AuthEvidence, review: ReviewEvidence) {
  return {
    emailConfirmed: Boolean(auth.email && auth.email_confirmed_at),
    phoneConfirmed: Boolean(auth.phone && auth.phone_confirmed_at),
    profileReviewed: review?.status === "approved" && Boolean(review.reviewed_at),
    identityChecked: null,
  };
}

export type VerificationStatus = ReturnType<typeof verificationStatus>;
