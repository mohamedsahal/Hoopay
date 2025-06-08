import { Image } from 'react-native';

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxCacheSize = 50; // Maximum number of images to keep in memory
  }

  // Preload a single image
  async preloadImage(uri, priority = 'normal') {
    if (this.cache.has(uri)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const prefetch = Image.prefetch(uri);
      
      prefetch
        .then(() => {
          this.cache.set(uri, {
            uri,
            loadedAt: Date.now(),
            priority
          });
          console.log('Image preloaded:', uri);
          this.cleanupCache();
          resolve();
        })
        .catch((error) => {
          console.warn('Failed to preload image:', uri, error);
          reject(error);
        });
    });
  }

  // Preload multiple images
  async preloadImages(uris, priority = 'normal') {
    const promises = uris.map(uri => this.preloadImage(uri, priority));
    
    try {
      await Promise.allSettled(promises);
      console.log(`Preloaded ${uris.length} images`);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  // Add images to preload queue (for lazy preloading)
  queueForPreload(uris, priority = 'normal') {
    uris.forEach(uri => {
      if (!this.cache.has(uri) && !this.preloadQueue.find(item => item.uri === uri)) {
        this.preloadQueue.push({ uri, priority });
      }
    });

    this.processPreloadQueue();
  }

  // Process preload queue gradually
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, 3); // Process 3 at a time
      
      try {
        await Promise.allSettled(
          batch.map(item => this.preloadImage(item.uri, item.priority))
        );
        
        // Small delay between batches to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Error processing preload batch:', error);
      }
    }

    this.isPreloading = false;
  }

  // Clean up old cached images
  cleanupCache() {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Convert to array and sort by loadedAt timestamp
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        // Keep high priority images longer
        if (a[1].priority === 'high' && b[1].priority !== 'high') return 1;
        if (b[1].priority === 'high' && a[1].priority !== 'high') return -1;
        
        // Otherwise sort by age (oldest first)
        return a[1].loadedAt - b[1].loadedAt;
      });

    // Remove oldest entries (keeping high priority)
    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    toRemove.forEach(([uri]) => {
      this.cache.delete(uri);
    });

    console.log(`Cleaned up ${toRemove.length} cached images`);
  }

  // Check if image is cached
  isCached(uri) {
    return this.cache.has(uri);
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading
    };
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    this.preloadQueue.length = 0;
    this.isPreloading = false;
    console.log('Image cache cleared');
  }
}

// Create singleton instance
const imageCache = new ImageCache();

// Utility functions
export const preloadImages = (uris, priority) => imageCache.preloadImages(uris, priority);
export const queueImagesForPreload = (uris, priority) => imageCache.queueForPreload(uris, priority);
export const isImageCached = (uri) => imageCache.isCached(uri);
export const getCacheStatus = () => imageCache.getCacheStatus();
export const clearImageCache = () => imageCache.clearCache();

export default imageCache; 