// ═══════════════════════════════════════════════════════════════════
// VAANI Performance Optimization Service
// FlashList + Reanimated for smooth 60fps UI
// ═══════════════════════════════════════════════════════════════════

import { Dimensions, PixelRatio, Platform } from 'react-native';

// ─── Device Info ──────────────────────────────────────────────────────
export interface DeviceInfo {
  width: number;
  height: number;
  pixelRatio: number;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  os: 'ios' | 'android' | 'unknown';
  memoryClass?: number;
}

export function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();

  return {
    width,
    height,
    pixelRatio,
    isSmallDevice: width < 360 || height < 600,
    isLargeDevice: width >= 768 || height >= 1024,
    os: Platform.OS as 'ios' | 'android' | 'unknown',
  };
}

// ─── Image Optimization ───────────────────────────────────────────────
export interface ImageConfig {
  width: number;
  height: number;
  quality: number;
  resizeMode: 'cover' | 'contain' | 'stretch' | 'center';
}

const IMAGE_CONFIGS: Record<string, ImageConfig> = {
  thumbnail: { width: 80, height: 80, quality: 60, resizeMode: 'cover' },
  card: { width: 160, height: 120, quality: 70, resizeMode: 'cover' },
  avatar: { width: 48, height: 48, quality: 80, resizeMode: 'cover' },
  banner: { width: 320, height: 180, quality: 75, resizeMode: 'cover' },
  full: { width: 640, height: 480, quality: 85, resizeMode: 'contain' },
};

export function getOptimizedImageConfig(type: keyof typeof IMAGE_CONFIGS): ImageConfig {
  return IMAGE_CONFIGS[type] || IMAGE_CONFIGS.card;
}

// ─── List Optimization ────────────────────────────────────────────────
export interface ListConfig {
  estimatedItemSize: number;
  numColumns: number;
  keyExtractor: (item: any, index: number) => string;
  getItemType: (item: any) => string;
  maxToRenderPerBatch: number;
  windowSize: number;
  removeClippedSubviews: boolean;
  initialNumToRender: number;
}

export const DEFAULT_LIST_CONFIG: ListConfig = {
  estimatedItemSize: 72,
  numColumns: 1,
  keyExtractor: (item: any, index: number) => item.id || String(index),
  getItemType: () => 'default',
  maxToRenderPerBatch: 10,
  windowSize: 10,
  removeClippedSubviews: true,
  initialNumToRender: 8,
};

export function getOptimizedListConfig(type: 'small' | 'medium' | 'large' = 'medium'): ListConfig {
  const configs = {
    small: { ...DEFAULT_LIST_CONFIG, estimatedItemSize: 56, initialNumToRender: 6 },
    medium: DEFAULT_LIST_CONFIG,
    large: { ...DEFAULT_LIST_CONFIG, estimatedItemSize: 100, maxToRenderPerBatch: 15 },
  };
  return configs[type];
}

// ─── Animation Configurations ───────────────────────────────────────
export interface AnimationConfig {
  duration: number;
  easing: string;
  useNativeDriver: boolean;
  delay?: number;
}

export const ANIMATION_CONFIGS = {
  // Quick feedback animations
  tap: { duration: 100, easing: 'ease-out', useNativeDriver: true } as AnimationConfig,
  
  // Standard transitions
  fade: { duration: 200, easing: 'ease-in-out', useNativeDriver: true } as AnimationConfig,
  slide: { duration: 300, easing: 'ease-out', useNativeDriver: true } as AnimationConfig,
  
  // Large motion animations
  expand: { duration: 400, easing: 'spring', useNativeDriver: true, delay: 0 } as AnimationConfig,
  collapse: { duration: 300, easing: 'ease-in', useNativeDriver: true } as AnimationConfig,
  
  // Micro-interactions
  pulse: { duration: 600, easing: 'linear', useNativeDriver: false } as AnimationConfig,
  shake: { duration: 400, easing: 'ease-out', useNativeDriver: false } as AnimationConfig,
  
  // Chart animations
  draw: { duration: 800, easing: 'ease-out', useNativeDriver: false } as AnimationConfig,
  fill: { duration: 500, easing: 'ease-in-out', useNativeDriver: false } as AnimationConfig,
};

// ─── Spring Configurations ───────────────────────────────────────────
export const SPRING_CONFIGS = {
  // Gentle bounce
  gentle: { damping: 20, tension: 100, stiffness: 100 },
  
  // Standard spring
  standard: { damping: 15, tension: 150, stiffness: 150 },
  
  // Bouncy spring
  bouncy: { damping: 10, tension: 200, stiffness: 200 },
  
  // Snappy spring
  snappy: { damping: 12, tension: 180, stiffness: 180 },
  
  // Stiff spring
  stiff: { damping: 25, tension: 300, stiffness: 300 },
};

// ─── Caching Strategy ─────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_MAX_SIZE = 100;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (memoryCache.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, timestamp: Date.now(), ttl });
}

export function getCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function clearCache(): void {
  memoryCache.clear();
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    clearCache();
    return;
  }
  
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// ─── Debounce & Throttle ─────────────────────────────────────────────
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ─── Network Request Batching ─────────────────────────────────────────
interface BatchedRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

const requestBatches = new Map<string, BatchedRequest<any>[]>();
const BATCH_DELAY = 100; // ms

export async function batchRequests<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const batch = requestBatches.get(key) || [];
    batch.push({ resolve, reject, timestamp: Date.now() });
    requestBatches.set(key, batch);
    
    // Process batch after delay
    setTimeout(() => {
      const batchItems = requestBatches.get(key);
      if (batchItems) {
        requestBatches.delete(key);
        requestFn()
          .then(data => {
            batchItems.forEach(item => item.resolve(data));
          })
          .catch(error => {
            batchItems.forEach(item => item.reject(error));
          });
      }
    }, BATCH_DELAY);
  });
}

// ─── Memoization ─────────────────────────────────────────────────────
const memoCache = new Map<string, { value: any; args: any[] }>();
const MEMO_MAX_SIZE = 50;

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  return function (this: any, ...args: Parameters<T>) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const cached = memoCache.get(key);
    
    if (cached && JSON.stringify(cached.args) === JSON.stringify(args)) {
      return cached.value;
    }
    
    const result = fn.apply(this, args);
    
    if (memoCache.size >= MEMO_MAX_SIZE) {
      const firstKey = memoCache.keys().next().value;
      if (firstKey) memoCache.delete(firstKey);
    }
    
    memoCache.set(key, { value: result, args });
    return result;
  } as T;
}

// ─── Memory Management ────────────────────────────────────────────────
export async function clearUnusedMemory(): Promise<void> {
  // Clear expired cache entries
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      memoryCache.delete(key);
    }
  }
  
  // Suggest garbage collection (if available)
  if (Platform.OS === 'android') {
    // On Android, we can trigger GC through native modules if needed
  }
}

// ─── Performance Monitoring ─────────────────────────────────────────
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const metrics: PerformanceMetric[] = [];

export function startMetric(name: string): void {
  metrics.push({ name, startTime: performance.now() });
}

export function endMetric(name: string): number | null {
  const metric = metrics.find(m => m.name === name && !m.endTime);
  if (metric) {
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    return metric.duration;
  }
  return null;
}

export function getMetrics(): PerformanceMetric[] {
  return [...metrics];
}

export function clearMetrics(): void {
  metrics.length = 0;
}

// ─── Optimize Image Size ─────────────────────────────────────────────
export function getOptimizedImageSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  const pixelRatio = PixelRatio.get();
  const deviceWidth = Dimensions.get('window').width;
  
  // Scale down for high DPI screens
  const scaleFactor = Math.min(
    maxWidth / originalWidth,
    maxHeight / originalHeight
  );
  
  if (scaleFactor < 1) {
    width = Math.round(originalWidth * scaleFactor);
    height = Math.round(originalHeight * scaleFactor);
  }
  
  // Limit total pixels for memory optimization
  const maxPixels = 1024 * 1024; // 1MP
  const currentPixels = width * height;
  
  if (currentPixels > maxPixels) {
    const factor = Math.sqrt(maxPixels / currentPixels);
    width = Math.round(width * factor);
    height = Math.round(height * factor);
  }
  
  return { width, height };
}

// ─── Layout Optimization ─────────────────────────────────────────────
export function getOptimalColumnCount(itemWidth: number): number {
  const screenWidth = Dimensions.get('window').width;
  const padding = 32; // 16px padding on each side
  const availableWidth = screenWidth - padding;
  
  return Math.max(1, Math.floor(availableWidth / itemWidth));
}

export function getSpacing(totalItems: number, containerWidth: number, itemWidth: number, gap: number): number {
  const itemsPerRow = Math.floor(containerWidth / itemWidth);
  const totalGap = gap * (itemsPerRow - 1);
  const remainingSpace = containerWidth - totalGap;
  
  if (remainingSpace >= itemWidth * itemsPerRow) {
    return gap;
  }
  
  return Math.max(4, Math.floor((containerWidth - itemWidth * itemsPerRow) / (itemsPerRow - 1)));
}

// ─── Batch State Updates ─────────────────────────────────────────────
let pendingUpdates: Map<string, any> = new Map();
let updateScheduled = false;

export function scheduleStateUpdate(key: string, value: any): void {
  pendingUpdates.set(key, value);
  
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(() => {
      // Apply all pending updates at once
      const updates = new Map(pendingUpdates);
      pendingUpdates.clear();
      updateScheduled = false;
      
      // This would be used with a state management system
      // dispatcher.dispatch(BATCH_UPDATE, Object.fromEntries(updates));
    });
  }
}

// ─── Virtualized List Item Height ───────────────────────────────────
export function getEstimatedItemHeight(
  type: 'small' | 'medium' | 'large' | 'chart' | 'input'
): number {
  const heights = {
    small: 48,
    medium: 72,
    large: 120,
    chart: 200,
    input: 56,
  };
  return heights[type] || 72;
}

// ─── Prefetch Strategy ───────────────────────────────────────────────
export function getPrefetchConfig(): {
  batchSize: number;
  interval: number;
  maxItems: number;
} {
  const device = getDeviceInfo();
  
  if (device.isSmallDevice) {
    return { batchSize: 3, interval: 100, maxItems: 15 };
  }
  
  if (device.isLargeDevice) {
    return { batchSize: 8, interval: 50, maxItems: 30 };
  }
  
  return { batchSize: 5, interval: 75, maxItems: 20 };
}

export default {
  getDeviceInfo,
  getOptimizedImageConfig,
  getOptimizedListConfig,
  ANIMATION_CONFIGS,
  SPRING_CONFIGS,
  setCache,
  getCache,
  clearCache,
  invalidateCache,
  debounce,
  throttle,
  memoize,
  batchRequests,
  clearUnusedMemory,
  startMetric,
  endMetric,
  getMetrics,
  clearMetrics,
  getOptimizedImageSize,
  getOptimalColumnCount,
  getSpacing,
  scheduleStateUpdate,
  getEstimatedItemHeight,
  getPrefetchConfig,
};