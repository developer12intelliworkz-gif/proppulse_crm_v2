import { useState, useEffect, useCallback } from 'react';
import { User } from '@/contexts/AuthContext';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionTimeout: NodeJS.Timeout | null;
}

interface SecurityConfig {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

const defaultSecurityConfig: SecurityConfig = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
};

export const useSecureAuth = (config: Partial<SecurityConfig> = {}) => {
  const securityConfig = { ...defaultSecurityConfig, ...config };
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sessionTimeout: null,
  });

  // Check for account lockout
  const isAccountLocked = useCallback(() => {
    const lockoutData = localStorage.getItem('auth_lockout');
    if (!lockoutData) return false;

    const { attempts, lockoutUntil } = JSON.parse(lockoutData);
    const now = Date.now();

    if (attempts >= securityConfig.maxLoginAttempts && now < lockoutUntil) {
      return true;
    }

    // Clear expired lockout
    if (now >= lockoutUntil) {
      localStorage.removeItem('auth_lockout');
    }

    return false;
  }, [securityConfig.maxLoginAttempts]);

  // Record failed login attempt
  const recordFailedAttempt = useCallback(() => {
    const lockoutData = localStorage.getItem('auth_lockout');
    const now = Date.now();
    let attempts = 1;

    if (lockoutData) {
      const existing = JSON.parse(lockoutData);
      attempts = existing.attempts + 1;
    }

    localStorage.setItem('auth_lockout', JSON.stringify({
      attempts,
      lockoutUntil: now + (securityConfig.lockoutDurationMinutes * 60 * 1000),
    }));
  }, [securityConfig.lockoutDurationMinutes]);

  // Clear login attempts on successful login
  const clearFailedAttempts = useCallback(() => {
    localStorage.removeItem('auth_lockout');
  }, []);

  // Set session timeout
  const setSessionTimeout = useCallback(() => {
    const timeoutId = setTimeout(() => {
      // Force logout on session timeout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        sessionTimeout: null,
      }));
    }, securityConfig.sessionTimeoutMinutes * 60 * 1000);

    setAuthState(prev => ({
      ...prev,
      sessionTimeout: timeoutId,
    }));

    return timeoutId;
  }, [securityConfig.sessionTimeoutMinutes]);

  // Clear session timeout
  const clearSessionTimeout = useCallback(() => {
    if (authState.sessionTimeout) {
      clearTimeout(authState.sessionTimeout);
      setAuthState(prev => ({ ...prev, sessionTimeout: null }));
    }
  }, [authState.sessionTimeout]);

  // Validate token integrity
  const validateToken = useCallback((token: string): boolean => {
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Check if token is not a demo token (security risk)
      if (token === 'demo_token') return false;

      return true;
    } catch {
      return false;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData && validateToken(token)) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            sessionTimeout: null,
          });

          // Set session timeout for existing sessions
          setSessionTimeout();
        } else {
          // Clear invalid session data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionTimeout: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionTimeout: null,
        });
      }
    };

    initializeAuth();
  }, [validateToken, setSessionTimeout]);

  // Activity monitoring for session extension
  useEffect(() => {
    const handleUserActivity = () => {
      if (authState.isAuthenticated) {
        clearSessionTimeout();
        setSessionTimeout();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearSessionTimeout();
    };
  }, [authState.isAuthenticated, clearSessionTimeout, setSessionTimeout]);

  return {
    ...authState,
    isAccountLocked,
    recordFailedAttempt,
    clearFailedAttempts,
    validateToken,
    securityConfig,
  };
};