import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  error: string | null;
  onLogin: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onLogin }) => {
  if (!error) return null;

  return (
    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
      {error}
      {error.includes("log in") && (
        <Button className="ml-4" onClick={onLogin} variant="outline">
          Go to Login
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
