const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const port = typeof window !== "undefined" ? window.location.port : "8080";

// Security configuration and environment validation
export const SECURITY_CONFIG = {
  // Session management
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,

  // Rate limiting
  API_RATE_LIMIT_REQUESTS: 100,
  API_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute

  // File upload limits
  MAX_FILE_SIZE_MB: 2,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],

  // Password policy
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,

  // // API endpoints for local
  API_BASE_URL: `http://${host}:3001/api`,
  ONLY_URL: `http://${host}:3001/api`,
  BASE: `http://${host}:3001`,
  FRONTEND_BASE: `http://${host}:${port || "8080"}`,
  DOCUMENT_BASE_URL: `http://${host}:3001/documents/lead`,

  // API_BASE_URL: "http://intelliworkz.digital:3001/api",
  // BASE: "http://intelliworkz.digital:3001",
  // FRONTEND_BASE: "http://intelliworkz.digital:8080",

  // API endpoint
  // API_BASE_URL: "https://intelliworkz.digital/api",
  // BASE: "https://intelliworkz.digital",
  // FRONTEND_BASE: "https://intelliworkz.digital",

  // // For Production
  // API_BASE_URL: "https://intelliworkz.digital:4443/api",
  // BASE: "https://intelliworkz.digital:4443/api",
  // ONLY_URL: "https://intelliworkz.digital/api",
  // FRONTEND_BASE: "https://intelliworkz.digital:4443",
  // UPLOAD_URL: "https://intelliworkz.digital/api/public",

  // For Production (no port, 443 default)
  // API_BASE_URL: "https://crm.intelliworkz.digital/api",
  // BASE: "https://crm.intelliworkz.digital",
  // ONLY_URL: "https://crm.intelliworkz.digital/api",
  // FRONTEND_BASE: "https://crm.intelliworkz.digital",
  // UPLOAD_URL: "https://crm.intelliworkz.digital/api/public",

  // API_BASE_URL: "https://crm.intelliworkz.digital:8443/api",
  // BASE: "https://crm.intelliworkz.digital:8443",
  // FRONTEND_BASE: "https://crm.intelliworkz.digital:8443",
  // UPLOAD_URL: "https://crm.intelliworkz.digital/api/public",
  // ONLY_URL: "https://crm.intelliworkz.digital/api",

  // Security headers
  CONTENT_SECURITY_POLICY: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "connect-src": ["'self'", "https://intelliworkz.digital"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
  },
} as const;

// Validate environment for security
export const validateSecurityEnvironment = (): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Check for development environment indicators
  if (
    window.location.protocol === "http:" &&
    window.location.hostname !== "localhost"
  ) {
    issues.push("Application is not using HTTPS in production");
  }

  // Check localStorage availability and security
  try {
    localStorage.setItem("__test__", "test");
    localStorage.removeItem("__test__");
  } catch {
    issues.push("LocalStorage is not available or blocked");
  }

  // Check for console access (potential debugging tools)
  if (
    typeof window.console !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    // In production, we might want to disable console access
    console.warn("Console access detected in production environment");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Security monitoring
export const logSecurityEvent = (
  event: string,
  details?: Record<string, any>,
) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In production, this should send to a security monitoring service
  console.warn("[SECURITY EVENT]", securityLog);
};

// XSS Protection utilities
export const createSecureElement = (
  tagName: string,
  attributes: Record<string, string> = {},
): HTMLElement => {
  const element = document.createElement(tagName);

  // Sanitize attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("on") || key.toLowerCase().includes("script")) {
      logSecurityEvent("XSS_ATTEMPT", { attribute: key, value });
      return;
    }
    element.setAttribute(key, value);
  });

  return element;
};
