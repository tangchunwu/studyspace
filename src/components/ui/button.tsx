import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'default', 
    className = '',
    disabled = false,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700',
      primary: 'bg-indigo-500 text-white hover:bg-indigo-600',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      link: 'text-indigo-600 underline-offset-4 hover:underline',
    };
    
    const sizes = {
      default: 'h-10 py-2 px-4 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-8 text-base',
    };
    
    const variantStyle = variants[variant];
    const sizeStyle = sizes[size];
    
    return (
      <button
        className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 