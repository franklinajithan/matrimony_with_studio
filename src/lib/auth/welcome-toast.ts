const LOGIN_WELCOME_KEY = "cupidmatch.loginWelcome";

export function markLoginWelcomePending() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGIN_WELCOME_KEY, "1");
}

export function consumeLoginWelcome(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(LOGIN_WELCOME_KEY) !== "1") return false;
  sessionStorage.removeItem(LOGIN_WELCOME_KEY);
  return true;
}
