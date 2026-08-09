// Instagram Graph API primitives — carousel publishing (v1 scope: per-edition winner
// carousel). Pure, credential-agnostic: a site resolves its own account ID / access token
// (and optionally app ID/secret, only needed for debugToken) from its own storage and
// passes them in. Bump GRAPH_API_VERSION when Meta deprecates the current one.
//
// Publishing an Instagram carousel is a two-step container model: create one child
// container per image (is_carousel_item), then a parent CAROUSEL container referencing
// those child IDs, then publish the parent. Images must already be at a public URL —
// Cloudinary URLs (already used for every poster/photo in this codebase) satisfy that.
//
// `instagram_content_publish` requires Meta App Review before it works for any account
// beyond the app's own registered testers — true for both OAuth and a manually pasted
// token, so this module can be fully built/tested (via a tester account) ahead of that
// review completing.

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface GraphApiError {
  error?: { message?: string; type?: string; code?: number };
}

async function graphFetch<T>(url: string, init?: RequestInit): Promise<T> {
  // Same anti-hang principle as every other external call fixed since 2026-08-05: never
  // let a slow/stuck Graph API request hold a request (and its DB connection) open forever.
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body as GraphApiError)?.error?.message || `Graph API request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function createCarouselChildContainer(
  accountId: string,
  accessToken: string,
  imageUrl: string,
): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: "true",
    access_token: accessToken,
  });
  const body = await graphFetch<{ id: string }>(`${GRAPH_BASE}/${accountId}/media`, {
    method: "POST",
    body: params,
  });
  return body.id;
}

export async function createCarouselContainer(
  accountId: string,
  accessToken: string,
  childIds: string[],
  caption: string,
): Promise<string> {
  const params = new URLSearchParams({
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: accessToken,
  });
  const body = await graphFetch<{ id: string }>(`${GRAPH_BASE}/${accountId}/media`, {
    method: "POST",
    body: params,
  });
  return body.id;
}

export async function publishContainer(
  accountId: string,
  accessToken: string,
  creationId: string,
): Promise<string> {
  const params = new URLSearchParams({ creation_id: creationId, access_token: accessToken });
  const body = await graphFetch<{ id: string }>(`${GRAPH_BASE}/${accountId}/media_publish`, {
    method: "POST",
    body: params,
  });
  return body.id;
}

export interface TokenDebugInfo {
  valid: boolean;
  /** null means either "never expires" (long-lived page tokens) or "unknown" — Graph API
   *  doesn't distinguish the two in the expires_at field (both come back as 0/absent). */
  expiresAt: Date | null;
  scopes: string[];
}

/**
 * Requires a Meta App ID + secret to build the inspecting "app access token" — separate
 * from the account ID / access token needed for publishing itself, so a site can publish
 * without ever configuring this (status simply won't be checkable).
 */
export async function debugToken(accessToken: string, appId: string, appSecret: string): Promise<TokenDebugInfo> {
  const inspectingToken = `${appId}|${appSecret}`;
  const url = `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(inspectingToken)}`;
  const body = await graphFetch<{ data?: { is_valid?: boolean; expires_at?: number; scopes?: string[] } }>(url);
  const data = body.data ?? {};
  return {
    valid: !!data.is_valid,
    expiresAt: data.expires_at ? new Date(data.expires_at * 1000) : null,
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
  };
}
