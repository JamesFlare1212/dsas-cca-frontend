// src/utils/concurrencyLimiter.ts
type AsyncTask<T = any> = () => Promise<T>;

class ConcurrencyLimiter {
  private limit: number;
  private activeCount: number;
  private queue: Array<{ task: AsyncTask; resolve: (value: any) => void; reject: (reason?: any) => void }>;

  constructor(limit: number) {
    this.limit = limit;
    this.activeCount = 0;
    this.queue = [];
  }

  private async next() {
    if (this.activeCount >= this.limit || this.queue.length === 0) {
      return;
    }

    this.activeCount++;
    const { task, resolve, reject } = this.queue.shift()!;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeCount--;
      this.next();
    }
  }

  public run<T>(task: AsyncTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }
}

// Export a single instance
const activityDetailLimiter = new ConcurrencyLimiter(16); // As requested
export default activityDetailLimiter;