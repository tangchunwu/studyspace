import React, { HTMLAttributes, forwardRef } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  className?: string;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-blue-50 text-blue-700 border border-blue-200',
      destructive: 'bg-red-50 text-red-700 border border-red-200',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 rounded-md ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export interface AlertTitleProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`font-medium text-base ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-1 text-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AlertDescription.displayName = 'AlertDescription';

export { AlertTitle, AlertDescription };
export default Alert; 