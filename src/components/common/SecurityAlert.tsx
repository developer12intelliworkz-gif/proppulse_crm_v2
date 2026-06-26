import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info } from 'lucide-react';

interface SecurityAlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  showIcon?: boolean;
  className?: string;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  title,
  message,
  showIcon = true,
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Shield className="h-4 w-4" />;
      case 'warning':
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {showIcon && getIcon()}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;