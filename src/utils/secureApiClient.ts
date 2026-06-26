// Secure API client with rate limiting and error handling
import { handleSessionExpired } from "@/utils/sessionAuth";
import { SECURITY_CONFIG } from "@/config/security";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class SecureApiClient {
  private baseUrl: string;
  private rateLimitConfig: RateLimitConfig;
  private requestHistory: Map<string, RequestRecord> = new Map();

  constructor(baseUrl: string, rateLimitConfig: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.baseUrl = baseUrl;
    this.rateLimitConfig = rateLimitConfig;
  }

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const record = this.requestHistory.get(endpoint);

    if (!record) {
      this.requestHistory.set(endpoint, { timestamp: now, count: 1 });
      return true;
    }

    // Reset count if window has passed
    if (now - record.timestamp > this.rateLimitConfig.windowMs) {
      this.requestHistory.set(endpoint, { timestamp: now, count: 1 });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.rateLimitConfig.maxRequests) {
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  private sanitizeHeaders(headers: HeadersInit = {}): HeadersInit {
    const sanitized: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        sanitized[key] = this.sanitizeHeaderValue(value);
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        sanitized[key] = this.sanitizeHeaderValue(value);
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        sanitized[key] = this.sanitizeHeaderValue(value);
      });
    }

    return sanitized;
  }

  private sanitizeHeaderValue(value: string): string {
    // Remove potential injection attacks
    return value.replace(/[\r\n]/g, '');
  }

  private getAuthToken(): string | null {
    const token = localStorage.getItem('auth_token');
    
    // Validate token format
    if (!token || token === 'demo_token') {
      return null;
    }

    // Basic JWT validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return token;
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(endpoint)) {
        return {
          data: null,
          error: 'Rate limit exceeded. Please try again later.',
          status: 429
        };
      }

      // Prepare headers
      const headers = this.sanitizeHeaders(options.headers || {});
      const token = this.getAuthToken();
      
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      // Add security headers
      (headers as Record<string, string>)['Content-Type'] = 
        (headers as Record<string, string>)['Content-Type'] || 'application/json';
      (headers as Record<string, string>)['X-Requested-With'] = 'XMLHttpRequest';

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: T | null = null;
      let error: string | null = null;

      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        error = 'Invalid server response';
      }

      if (!response.ok) {
        // Don't expose internal server errors
        if (response.status >= 500) {
          error = 'Server error. Please try again later.';
        } else if (response.status === 401) {
          handleSessionExpired(endpoint);
          error = 'Session expired. Please log in again.';
        } else {
          error = (data as any)?.error || `Request failed with status ${response.status}`;
        }
      }

      return { data, error, status: response.status };

    } catch (fetchError) {
      console.error('Network error:', fetchError);
      
      let error = 'Network error. Please check your connection.';
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          error = 'Request timeout. Please try again.';
        }
      }

      return { data: null, error, status: 0 };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const secureApi = new SecureApiClient(SECURITY_CONFIG.BASE);
export default secureApi;