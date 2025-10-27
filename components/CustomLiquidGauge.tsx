import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, Defs, ClipPath } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, runOnJS, Easing } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LiquidGaugeProps {
  value: number;
  width?: number;
  height?: number;
  circleColor?: string;
  waveColor?: string;
  textColor?: string;
}

export const CustomLiquidGauge: React.FC<LiquidGaugeProps> = ({
  value,
  width = 150,
  height = 150,
  circleColor = '#f97316',
  waveColor = '#f97316',
  textColor = '#1f2937',
}) => {
  const padding = 10;
  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2;

  const radius = Math.min(width, height) / 2;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  const phase = useSharedValue(0);
  const fillLevel = useSharedValue(value / 100);

  const animatePhase = () => {
    phase.value = withTiming(
      phase.value + 2 * Math.PI,
      {
        duration: 4000,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(animatePhase)();
        }
      },
    );
  };

  useEffect(() => {
    animatePhase();
  }, []);

  useEffect(() => {
    fillLevel.value = withTiming(value / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedWaveProps = useAnimatedProps(() => {
    const amplitude = radius * 0.07;
    const wavelength = width * 0.7;
    const fillY = centerY + radius * (1 - 2 * fillLevel.value);

    let path = `M ${padding} ${fillY}`;
    for (let x = 0; x <= width; x += 2) {
      const y = fillY + amplitude * Math.sin((x / wavelength) * 2 * Math.PI + phase.value);
      path += ` L ${x + padding} ${y}`;
    }
    path += ` L ${svgWidth - padding} ${svgHeight} L ${padding} ${svgHeight} Z`;

    return { d: path };
  });

  return (
    <View style={{ width: svgWidth, height: svgHeight }}>
      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={centerX} cy={centerY} r={radius * 0.9} />
          </ClipPath>
        </Defs>

        <Circle cx={centerX} cy={centerY} r={radius} fill="none" stroke={circleColor} strokeWidth={radius * 0.1} />

        <AnimatedPath
          animatedProps={animatedWaveProps}
          fill={waveColor}
          clipPath="url(#circleClip)"
          fillOpacity={0.8}
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
