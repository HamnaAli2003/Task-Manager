// Maps Auth.js `?error=` codes to friendly, user-facing messages.
export function authErrorMessage(error?: string | null): string | null {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "This Google account is linked to another TaskMate account. Sign in to that account, or choose a different Google account.";
    case "SignInRequired":
      return "Sign in to TaskMate before connecting Google.";
    case "OAuthCallback":
    case "OAuthSignin":
      return "Google sign-in failed. Please try again.";
    case "AccessDenied":
      return "Access denied. Try a different account.";
    default:
      return error ? "Something went wrong. Please try again." : null;
  }
}
