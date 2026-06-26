import React, { useEffect, useState } from 'react';
import { validateSecurityEnvironment, logSecurityEvent, SECURITY_CONFIG } from '@/config/security';
import SecurityAlert from '@/components/common/SecurityAlert';

interface SecurityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

const SecurityMonitor: React.FC = () => {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Initial security validation
    const validation = validateSecurityEnvironment();
    
    if (!validation.isValid) {
      const issues = validation.issues.map(issue => ({
        type: 'warning' as const,
        message: issue,
        timestamp: new Date(),
      }));
      setSecurityIssues(issues);
      logSecurityEvent('SECURITY_VALIDATION_FAILED', { issues: validation.issues });
    }

    // Monitor for potential security threats
    const securityMonitoring = () => {
      const now = Date.now();
      const lastActivity = localStorage.getItem('last_activity');
      
      if (lastActivity) {
        const timeDiff = now - parseInt(lastActivity);
        if (timeDiff > SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000) {
          logSecurityEvent('SESSION_TIMEOUT_WARNING');
        }
      }
      
      localStorage.setItem('last_activity', now.toString());
    };

    // Set up periodic security checks
    const securityInterval = setInterval(securityMonitoring, 60000);

    return () => {
      clearInterval(securityInterval);
    };
  }, []);

  // Only show if there are issues and in development mode
  if (securityIssues.length === 0 || window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!showMonitor && securityIssues.length > 0 && (
        <button
          onClick={() => setShowMonitor(true)}
          className="bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-amber-600 transition-colors"
        >
          Security Issues ({securityIssues.length})
        </button>
      )}
      
      {showMonitor && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Security Monitor</h3>
            <button
              onClick={() => setShowMonitor(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {securityIssues.map((issue, index) => (
              <SecurityAlert
                key={index}
                type={issue.type}
                message={issue.message}
                className="text-sm"
              />
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor;