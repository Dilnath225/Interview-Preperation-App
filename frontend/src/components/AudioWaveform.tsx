import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  color = Colors.primary,
  barCount = 14,
  height = 48,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array.from({ length: barCount }, () => 8)
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        setBarHeights(
          Array.from({ length: barCount }, (_, index) => {
            // Create organic wave patterns with peak in the middle
            const baseFactor = Math.sin((index / (barCount - 1)) * Math.PI);
            const randomVariance = Math.random() * 0.6 + 0.4;
            const h = Math.max(8, Math.round(height * baseFactor * randomVariance));
            return h;
          })
        );
      }, 120);
    } else {
      setBarHeights(Array.from({ length: barCount }, () => 8));
    }

    return () => clearInterval(interval);
  }, [isActive, barCount, height]);

  return (
    <View style={[styles.container, { height }]}>
      {barHeights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: h,
              backgroundColor: color,
              opacity: isActive ? 0.9 : 0.35,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});
