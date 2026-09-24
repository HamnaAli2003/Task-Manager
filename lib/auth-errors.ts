// Maps Auth.js error codes (passed as ?error= after a failed OAuth flow) to
// user-friendly messages. Unknown/internal codes collapse to a generic message
// so we never leak stack traces or internal Auth.js details to the user.

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // A signed-out user tried Google with an email that already belongs to an
  // email/password account. No silent linking/merging — direct them to the
  // safe, explicit path.
  OAuthAccountNotLinked:
    "An account with this email already exists. Please sign in with your email and password first, then connect Google from your account settings.",
  AccessDenied: "Access was denied.",
  Configuration: "Authentication is not configured correctly. Please try again later.",
  OAuthSignin: "Signing in with that provider failed.",
  OAuthCallback: "The provider callback failed.",
  OAuthCreateAccount: "Your provider account could not be created.",
  EmailCreateAccount: "Your account could not be created.",
  Callback: "Your sign-in could not be completed.",
  CredentialsSignin: "Incorrect email or password.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export function friendlyAuthError(code?: string): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
}