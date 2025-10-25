import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, Defs, ClipPath } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withRepeat } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LiquidGaugeProps {
  value: number;
  width?: number;
  height?: number;
  circleColor?: string;
  waveColor?: string;
  textColor?: string;
  waveTextColor?: string;
}

export const CustomLiquidGauge: React.FC<LiquidGaugeProps> = ({
  value,
  width = 150,
  height = 150,
  circleColor = '#f97316',
  waveColor = '#f97316',
  textColor = '#1f2937',
  waveTextColor = '#ffffff',
}) => {
  const padding = 10;
  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2;

  const radius = Math.min(width, height) / 2;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  const waveOffset = useSharedValue(0);
  const fillLevel = useSharedValue(0);

  useEffect(() => {
    fillLevel.value = withTiming(value / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Create a continuous wave by animating through one complete wavelength
    waveOffset.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [value]);

  const animatedWaveProps = useAnimatedProps(() => {
    const amplitude = radius * 0.08;
    const waveLength = width * 0.6;
    const fillHeight = radius * 2 * (1 - fillLevel.value) + padding;

    // Use waveOffset (0 to 1) and multiply by wavelength for seamless loop
    const offset = waveOffset.value * waveLength;

    let path = `M ${padding} ${fillHeight}`;

    // Draw the wave with continuous phase
    for (let x = 0; x <= width; x += 3) {
      const phase = ((x - offset) % waveLength) / waveLength;
      const y = fillHeight + amplitude * Math.sin(phase * Math.PI * 2);
      path += ` L ${x + padding} ${y}`;
    }

    path += ` L ${svgWidth - padding} ${svgHeight} L ${padding} ${svgHeight} Z`;

    return {
      d: path,
    };
  });

  return (
    <View style={{ width: svgWidth, height: svgHeight }}>
      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={centerX} cy={centerY} r={radius - radius * 0.05} />
          </ClipPath>
        </Defs>

        <Circle cx={centerX} cy={centerY} r={radius} fill="none" stroke={circleColor} strokeWidth={radius * 0.1} />

        <AnimatedPath
          animatedProps={animatedWaveProps}
          fill={waveColor}
          fillOpacity={0.8}
          clipPath="url(#circleClip)"
        />

        <SvgText
          x={centerX}
          y={centerY}
          fontSize={radius * 0.6}
          fontWeight="bold"
          fill={textColor}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {Math.round(value)}
        </SvgText>
      </Svg>
    </View>
  );
};
