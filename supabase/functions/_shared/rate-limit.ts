interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  endpoint: string;
}

/**
 * Simple rate limiting using database storage
 * Returns true if request should be allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  supabase: any, // Use any to avoid version conflicts between edge functions
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);

  try {
    // Get request count in current window
    const { data: requests, error } = await supabase
      .from('rate_limit_log')
      .select('created_at')
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow request (fail open)
      return { allowed: true };
    }

    const requestCount = requests?.length || 0;

    if (requestCount >= config.maxRequests) {
      // Find oldest request to calculate retry-after
      const oldestRequest = requests?.reduce((oldest: any, current: any) => {
        return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest;
      }, requests[0]);

      const retryAfter = oldestRequest
        ? Math.ceil((new Date(oldestRequest.created_at).getTime() + config.windowSeconds * 1000 - now.getTime()) / 1000)
        : config.windowSeconds;

      return { allowed: false, retryAfter };
    }

    // Log this request
    await supabase.from('rate_limit_log').insert({
      identifier,
      endpoint: config.endpoint,
      created_at: now.toISOString(),
    });

    return { allowed: true };
  } catch (err) {
    console.error('Rate limit error:', err);
    // On error, allow request (fail open)
    return { allowed: true };
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Try various headers that might contain real IP
  const headers = req.headers;
  const ip = 
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-client-ip') ||
    'unknown';
  
  return ip;
}
