import { SocialAccount, PostContent, PostResult, AuthUrlResult } from './types';

/**
 * Abstract class defining the required interface for all social media providers.
 * Each platform (Meta, X, LinkedIn) must extend this class.
 */
export abstract class SocialProvider {
  /** The platform identifier (e.g., 'instagram', 'twitter') */
  abstract readonly platform: string;

  /**
   * Publishes content to the specified social media account.
   * @param account The connected social account to use for posting.
   * @param content The text and media content to be published.
   * @returns A promise resolving to the result of the post attempt.
   */
  abstract post(account: SocialAccount, content: PostContent): Promise<PostResult>;

  /**
   * Refreshes the access token for the social account using its refresh token.
   * @param account The social account containing the refresh token.
   * @returns A promise resolving to the updated SocialAccount object.
   */
  abstract refreshToken(account: SocialAccount): Promise<SocialAccount>;

  /**
   * Validates if the current access token is still active and working.
   * @param account The social account to validate.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  abstract validate(account: SocialAccount): Promise<boolean>;

  /**
   * Generates the initial authorization URL to start the OAuth2 flow.
   * @returns A promise resolving to the authorization URL and state/verifier.
   * @throws Error if the platform does not support OAuth2 or it's not implemented.
   */
  async getAuthUrl(): Promise<AuthUrlResult> {
    throw new Error(`getAuthUrl not implemented for ${this.platform}`);
  }

  /**
   * Handles the OAuth2 callback by exchanging the code for an access token.
   * @param code The authorization code returned by the platform.
   * @param state The state string returned by the platform for verification.
   * @returns A promise resolving to the newly connected SocialAccount.
   * @throws Error if the code exchange fails or is not implemented.
   */
  async handleCallback(code: string, state: string): Promise<SocialAccount> {
    throw new Error(`handleCallback not implemented for ${this.platform}`);
  }
}
