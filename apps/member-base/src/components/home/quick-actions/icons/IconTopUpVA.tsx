import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconTopUpVAProps {
  width?: number;
  height?: number;
  color?: string;
  variant?: string;
}

export const IconTopUpVA: React.FC<IconTopUpVAProps> = ({
  width = 24,
  height = 24,
  color = '#292D32',
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
      fill={color}
      fillOpacity="0.4"
    />
    <Path
      d="M14.5 4.5V6.5C14.5 7.6 13.6 8.5 12.5 8.5C11.4 8.5 10.5 7.6 10.5 6.5V4.5C10.5 3.4 11.4 2.5 12.5 2.5C13.6 2.5 14.5 3.4 14.5 4.5Z"
      fill={color}
    />
    <Path
      d="M8 13H12"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 17H16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
