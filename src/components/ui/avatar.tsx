import React, { ImgHTMLAttributes, forwardRef } from 'react';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className = '', src, alt = 'Avatar', ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={`h-10 w-10 rounded-full object-cover ${className}`}
        {...props}
      />
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar; 