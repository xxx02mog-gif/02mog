import React from 'react';

interface SparkleIconProps {
  color: string;
  size?: number;
  withBorder?: boolean;
  borderColor?: string;
  className?: string;
}

export const SparkleIcon: React.FC<SparkleIconProps> = ({
  color,
  size = 11,
  withBorder = false,
  borderColor = '#ffffff',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ overflow: 'visible', display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
        fill={color}
        stroke={withBorder ? borderColor : 'none'}
        strokeWidth={withBorder ? 3 : 0}
        strokeLinejoin="round"
        style={{ paintOrder: 'stroke fill' }}
      />
    </svg>
  );
};
