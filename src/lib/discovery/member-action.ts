/** Keep duplicate clicks locked even before React has rendered the busy state. */
export async function runMemberAction(options: {
  key: string;
  pending: Set<string>;
  authenticate: () => Promise<string | undefined>;
  perform: (userId: string) => Promise<void>;
  onSuccess: () => void;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
}): Promise<void> {
  if (options.pending.has(options.key)) return;
  options.pending.add(options.key);
  options.onBusy(true);
  try {
    const userId = await options.authenticate();
    if (!userId) throw new Error("Your session has expired. Please sign in again.");
    await options.perform(userId);
    options.onSuccess();
  } catch (error) {
    // PostgREST errors are often plain objects rather than Error instances.
    const message = error && typeof error === "object" && "message" in error
      && typeof error.message === "string" ? error.message : "Please try again.";
    options.onError(message);
  } finally {
    options.pending.delete(options.key);
    options.onBusy(false);
  }
}
