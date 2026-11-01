/** Lock synchronously, before auth resolves or React commits a disabled button. */
export function createMemberActionRunner() {
  const pending = new Set<string>();
  return async (key: string, options: {
    getUserId: () => Promise<string>;
    action: (userId: string) => Promise<void>;
    setBusy: (pending: boolean) => void;
    onError: (error: unknown) => void;
  }): Promise<void> => {
    if (pending.has(key)) return;
    pending.add(key);
    options.setBusy(true);
    try {
      const userId = await options.getUserId();
      await options.action(userId);
    } catch (error) {
      options.onError(error);
    } finally {
      pending.delete(key);
      options.setBusy(false);
    }
  };
}
