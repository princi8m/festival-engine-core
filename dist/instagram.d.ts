export declare function createCarouselChildContainer(accountId: string, accessToken: string, imageUrl: string): Promise<string>;
export declare function createCarouselContainer(accountId: string, accessToken: string, childIds: string[], caption: string): Promise<string>;
export declare function publishContainer(accountId: string, accessToken: string, creationId: string): Promise<string>;
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
export declare function debugToken(accessToken: string, appId: string, appSecret: string): Promise<TokenDebugInfo>;
//# sourceMappingURL=instagram.d.ts.map