import { useEffect, useState } from 'react';

/**
 * High-performance Concurrency & Dynamic Loading Manager for Remote Images.
 *
 * Prevents mobile UI hangs, network queue saturation, and GC memory spikes
 * by limiting simultaneous remote HTTP image downloads/decodes (default max: 3-4 slots).
 */

const MAX_CONCURRENT_IMAGE_LOADS = 4;

interface QueueItem {
  id: string;
  uri: string;
  priority: number; // Higher number = higher priority
  startLoad: () => void;
}

class ImageConcurrencyManager {
  private activeCount = 0;
  private queue: QueueItem[] = [];
  private completedUris = new Set<string>();

  /**
   * Request permission to load an image.
   * If already loaded/cached or under concurrency limit, starts immediately.
   * Otherwise queues and notifies when a slot becomes available.
   * Returns an unsubscribe/cancel function.
   */
  requestLoad(
    uri: string,
    priority: number = 0,
    startLoad: () => void
  ): () => void {
    if (!uri) return () => {};

    // If already downloaded/cached in this session, execute immediately without consuming a queue slot
    if (this.completedUris.has(uri)) {
      startLoad();
      return () => {};
    }

    const id = `${uri}_${Date.now()}_${Math.random()}`;

    // If slots available, start immediately
    if (this.activeCount < MAX_CONCURRENT_IMAGE_LOADS) {
      this.activeCount++;
      startLoad();
      return () => {
        // In case cancelled while loading
        this.releaseSlot(uri, false);
      };
    }

    // Otherwise add to prioritized queue
    const item: QueueItem = { id, uri, priority, startLoad };
    this.queue.push(item);
    // Sort descending by priority so high priority images load first
    this.queue.sort((a, b) => b.priority - a.priority);

    // Return cleanup/cancel function
    return () => {
      this.queue = this.queue.filter((q) => q.id !== id);
    };
  }

  /**
   * Report an image has finished loading (either success or error)
   * to free up the concurrency slot and trigger the next item in queue.
   */
  releaseSlot(uri: string, success: boolean = true) {
    if (success && uri) {
      this.completedUris.add(uri);
    }

    if (this.activeCount > 0) {
      this.activeCount--;
    }

    this.processNext();
  }

  private processNext() {
    if (this.activeCount < MAX_CONCURRENT_IMAGE_LOADS && this.queue.length > 0) {
      const nextItem = this.queue.shift();
      if (nextItem) {
        this.activeCount++;
        nextItem.startLoad();
      }
    }
  }

  /**
   * Check whether a URI is already cached in this session.
   */
  isCached(uri: string): boolean {
    return this.completedUris.has(uri);
  }
}

export const imageConcurrencyManager = new ImageConcurrencyManager();

/**
 * React hook to dynamically load remote images with concurrency throttling.
 *
 * @param uri Remote image URL
 * @param index Position index in the document (lower index = higher priority)
 */
export function useDynamicImageLoad(uri: string, index: number = 0) {
  const isAlreadyCached = imageConcurrencyManager.isCached(uri);
  // First MAX_CONCURRENT_IMAGE_LOADS images load immediately without effect delay
  const shouldStartImmediately = isAlreadyCached || index < MAX_CONCURRENT_IMAGE_LOADS;
  const [shouldLoad, setShouldLoad] = useState<boolean>(shouldStartImmediately);

  useEffect(() => {
    if (!uri || shouldStartImmediately) return;

    // Priority: earlier images get higher priority
    const priority = Math.max(0, 100 - index);

    const cancel = imageConcurrencyManager.requestLoad(uri, priority, () => {
      setShouldLoad(true);
    });

    return () => {
      cancel();
    };
  }, [uri, index, shouldStartImmediately]);

  const onLoaded = () => {
    imageConcurrencyManager.releaseSlot(uri, true);
  };

  const onError = () => {
    imageConcurrencyManager.releaseSlot(uri, false);
  };

  return { shouldLoad, onLoaded, onError };
}
