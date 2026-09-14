import React from 'react';

interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '16px',
  width = '100%',
  borderRadius = '6px',
}) => {
  return (
    <div
      className="animate-skeleton"
      style={{
        height,
        width,
        borderRadius,
        backgroundColor: '#202024',
      }}
    />
  );
};
