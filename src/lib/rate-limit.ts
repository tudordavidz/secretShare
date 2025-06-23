// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(
    identifier: string
  ): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(identifier, newEntry);
      return {
        allowed: true,
        remainingRequests: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Different rate limiters for different endpoints
export const generalRateLimit = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const secretCreateRateLimit = new RateLimiter(60 * 60 * 1000, 10); // 10 secrets per hour
export const secretAccessRateLimit = new RateLimiter(5 * 60 * 1000, 20); // 20 secret accesses per 5 minutes
export const authRateLimit = new RateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes

export function getClientIdentifier(req: Request): string {
  // Try to get real IP from headers (useful when behind proxy)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return "unknown";
}
