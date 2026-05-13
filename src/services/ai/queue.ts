// src/services/ai/queue.ts
import NetInfo from '@react-native-community/netinfo';

/**
 * A simple client-side rate limiter using a Token Bucket-like approach.
 * Limits requests to prevent 429 errors from OpenRouter free tier (20 req/min).
 */
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 3000; // 20 req/min = 1 req every 3 seconds

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Check network connectivity before starting
          const state = await NetInfo.fetch();
          if (!state.isConnected) {
            throw new Error('No internet connection');
          }

          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const nextRequest = this.queue.shift();
      if (nextRequest) {
        this.lastRequestTime = Date.now();
        await nextRequest();
      }
    }

    this.isProcessing = false;
  }
}

export const aiQueue = new RequestQueue();
