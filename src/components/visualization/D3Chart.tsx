import React, { useRef, useEffect } from 'react';
import { d3Utils } from '@/core/visualization';

interface D3ChartProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

/**
 * A simple D3 bar chart component
 */
const D3Chart: React.FC<D3ChartProps> = ({ data, width, height, color = '#4a90e2' }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart
    const container = chartRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create SVG
    const svg = d3Utils.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(40, 20)`);

    // Create scales
    const xScale = d3Utils.createLinearScale(
      [0, data.length - 1],
      [0, width - 60]
    );

    const yScale = d3Utils.createLinearScale(
      [0, Math.max(...data)],
      [height - 40, 0]
    );

    // Create axes
    const { xAxis, yAxis } = d3Utils.createAxes(xScale, yScale);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${height - 40})`)
      .call(xAxis);

    // Add y-axis
    svg.append('g').call(yAxis);

    // Create bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => xScale(i))
      .attr('y', d => yScale(d))
      .attr('width', width / data.length - 5)
      .attr('height', d => height - 40 - yScale(d))
      .attr('fill', color);

    // Animation
    svg.selectAll('.bar')
      .attr('y', height - 40)
      .attr('height', 0)
      .transition()
      .duration(750)
      .attr('y', d => yScale(d as number))
      .attr('height', d => height - 40 - yScale(d as number));

  }, [data, width, height, color]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default D3Chart;