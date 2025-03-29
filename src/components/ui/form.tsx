import React, { FormHTMLAttributes, forwardRef } from 'react';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  className?: string;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export default Form; 