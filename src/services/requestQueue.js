/**
 * Request Queue — prevents rate limits by spacing out API calls
 * Enforces minimum gap between calls
 * Auto-retries on 429 with exponential backoff
 */

let lastCallTime = 0;
const MIN_GAP_MS = 500; // 500ms gap = smooth conversation
const queue = [];
let isProcessing = false;

async function waitForGap() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastCallTime = Date.now();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;
  
  while (queue.length > 0) {
    const { requestFn, resolve, reject, retryCount } = queue[0];
    
    try {
      await waitForGap();
      const result = await requestFn();
      queue.shift();
      resolve(result);
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('rate') ||
                          error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && retryCount < 3) {
        // Retry with backoff: 2s, 4s, 8s
        const backoffMs = 2000 * Math.pow(2, retryCount);
        console.log(`Rate limited, retrying in ${backoffMs / 1000}s...`);
        await new Promise(r => setTimeout(r, backoffMs));
        queue[0].retryCount = retryCount + 1;
        // Retry same request
      } else {
        queue.shift();
        reject(error);
      }
    }
  }
  
  isProcessing = false;
}

export function enqueueRequest(requestFn) {
  return new Promise((resolve, reject) => {
    queue.push({ requestFn, resolve, reject, retryCount: 0 });
    processQueue();
  });
}

export function getQueueStatus() {
  return {
    queued: queue.length,
    isProcessing,
    timeSinceLastCall: Date.now() - lastCallTime,
  };
}
