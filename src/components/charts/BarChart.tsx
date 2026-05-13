import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export const BarChart = ({ data, height = 200, color = '#818CF8' }: BarChartProps) => {
  const maxVal = Math.max(...data.map(d => d.value)) * 1.2;
  const chartWidth = 300;
  const barWidth = (chartWidth / data.length) * 0.7;
  const spacing = (chartWidth / data.length) * 0.3;

  return (
    <View className="items-center">
      <Svg height={height} width={chartWidth}>
        <G>
          {data.map((d, i) => {
            const barHeight = (d.value / maxVal) * (height - 40);
            return (
              <G key={i}>
                <Rect
                  x={i * (barWidth + spacing)}
                  y={height - 20 - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={4}
                />
                <SvgText
                  x={i * (barWidth + spacing) + barWidth / 2}
                  y={height}
                  fontSize="10"
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  {d.date}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};
