/**
 * src/services/social/types.ts
 * Shared TypeScript types and interfaces for the Social Media Integration Layer.
 */

/** Supported social media platforms */
export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin';

/**
 * Represents a connected social media account.
 * This structure is used for both state management and database storage.
 */
export interface SocialAccount {
  /** Unique ID in our system */
  id: string;
  /** The app user's ID this account belongs to */
  userId: string;
  /** The platform name */
  platform: SocialPlatform;
  /** The ID of the account as provided by the platform (e.g., Twitter ID) */
  platformAccountId: string;
  /** Display name shown to the user */
  displayName: string;
  /** Optional URL to the profile picture */
  profilePicture?: string;
  /** OAuth access token for API requests */
  accessToken: string;
  /** Optional OAuth refresh token to renew the access token */
  refreshToken?: string;
  /** ISO string of when the access token expires */
  expiresAt?: string;
  /** Platform-specific additional data (e.g., permissions, scopes) */
  metadata?: Record<string, any>;
}

/**
 * Content payload for creating a new post.
 */
export interface PostContent {
  /** The main caption or body of the post */
  text: string;
  /** Optional list of image/video URLs to include */
  mediaUrls?: string[];
  /** Optional ISO string for scheduled publishing */
  scheduledAt?: string;
  /** Advanced platform-specific options (e.g., Meta's Reel vs Post) */
  platformOptions?: Record<string, any>;
}

/**
 * Result returned after a posting attempt.
 */
export interface PostResult {
  /** Whether the post was successfully created */
  success: boolean;
  /** The unique ID returned by the platform for the new post */
  platformPostId?: string;
  /** Error message if the attempt failed */
  error?: string;
  /** ISO string of when the attempt occurred */
  timestamp: string;
}

/**
 * Result returned when initiating an OAuth flow.
 */
export interface AuthUrlResult {
  /** The URL the user should be redirected to for authorization */
  url: string;
  /** CSRF protection state string */
  state: string;
  /** PKCE code verifier (required for some platforms like Twitter/LinkedIn) */
  codeVerifier?: string;
}
