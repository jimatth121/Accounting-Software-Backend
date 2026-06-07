// Thin wrapper around Clerk's Backend REST API for invitations.
// All functions degrade gracefully when CLERK_SECRET_KEY isn't configured.

const BASE_URL = "https://api.clerk.com/v1";

export function isClerkConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json"
  };
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "").replace(/\/+$/, "");
}

export function inviteSignUpUrl({ token } = {}) {
  const base = frontendUrl();
  if (!base) return "";
  return token ? `${base}/sign-up?__clerk_ticket=${encodeURIComponent(token)}` : `${base}/sign-up`;
}

// Create an invitation. Returns:
//   { ok: true,  id, status, url, mode: "clerk" }                    // email sent by Clerk
//   { ok: false, code, error, retryable, url, mode: "manual" }       // graceful fallback
export async function sendInvitation({ email, role, workspaceName }) {
  const fallbackUrl = inviteSignUpUrl();
  if (!isClerkConfigured()) {
    return {
      ok: false,
      mode: "manual",
      code: "no_clerk_secret",
      error: "CLERK_SECRET_KEY not configured — share the sign-up URL manually.",
      retryable: false,
      url: fallbackUrl
    };
  }

  const redirectBase = frontendUrl();
  const redirectUrl = redirectBase ? `${redirectBase}/dashboard` : undefined;

  let response;
  try {
    response = await fetch(`${BASE_URL}/invitations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email_address: email,
        redirect_url: redirectUrl,
        public_metadata: { role, workspaceName: workspaceName || "" },
        notify: true,
        ignore_existing: false
      })
    });
  } catch (error) {
    return {
      ok: false,
      mode: "manual",
      code: "network_error",
      error: error instanceof Error ? error.message : "Could not reach Clerk.",
      retryable: true,
      url: fallbackUrl
    };
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const clerkError = payload?.errors?.[0];
    const message = clerkError?.long_message || clerkError?.message || `Clerk responded ${response.status}`;
    const code = clerkError?.code || `clerk_${response.status}`;
    return {
      ok: false,
      mode: code === "duplicate_record" ? "already_exists" : "manual",
      code,
      error: message,
      retryable: response.status >= 500 || response.status === 429,
      url: fallbackUrl
    };
  }

  return {
    ok: true,
    mode: "clerk",
    id: payload.id,
    status: payload.status || "pending",
    url: payload.url || fallbackUrl
  };
}

export async function revokeInvitation(invitationId) {
  if (!isClerkConfigured() || !invitationId) return { ok: true, mode: "noop" };
  let response;
  try {
    response = await fetch(`${BASE_URL}/invitations/${invitationId}/revoke`, {
      method: "POST",
      headers: authHeaders()
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reach Clerk." };
  }
  if (!response.ok && response.status !== 404) {
    const payload = await response.json().catch(() => ({}));
    return { ok: false, error: payload?.errors?.[0]?.message || `Clerk responded ${response.status}` };
  }
  return { ok: true };
}
