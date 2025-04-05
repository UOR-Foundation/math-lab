import * as d3 from 'd3';

/**
 * D3 Utility functions for visualizations
 */
export const d3Utils = {
  /**
   * Create a new D3 selection for an element
   */
  select: (element: HTMLElement | null): d3.Selection<HTMLElement, unknown, null, undefined> => {
    if (!element) {
      throw new Error('Element is null or undefined');
    }
    return d3.select(element as HTMLElement);
  },

  /**
   * Create a scale for numerical values
   */
  createLinearScale: (
    domain: [number, number], 
    range: [number, number]
  ): d3.ScaleLinear<number, number> => {
    return d3.scaleLinear().domain(domain).range(range);
  },

  /**
   * Create a scale for categorical values
   */
  createOrdinalScale: <Domain extends d3.Numeric, Range>(
    domain: Domain[], 
    range: Range[]
  ): d3.ScaleOrdinal<Domain, Range> => {
    return d3.scaleOrdinal<Domain, Range>().domain(domain).range(range);
  },

  /**
   * Create a color scale
   */
  createColorScale: <Domain extends d3.Numeric>(
    domain: Domain[], 
    colorScheme: readonly string[] = d3.schemeCategory10
  ): d3.ScaleOrdinal<Domain, string> => {
    return d3.scaleOrdinal<Domain, string>().domain(domain).range(colorScheme);
  },

  /**
   * Create axes
   */
  createAxes: (
    xScale: d3.AxisScale<number>, 
    yScale: d3.AxisScale<number>
  ): { xAxis: d3.Axis<number>, yAxis: d3.Axis<number> } => {
    return {
      xAxis: d3.axisBottom(xScale),
      yAxis: d3.axisLeft(yScale)
    };
  },

  /**
   * Create and configure a line generator
   */
  createLineGenerator: (
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>
  ): d3.Line<[number, number]> => {
    return d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));
  },

  /**
   * Create a transition with default settings
   */
  createTransition: (selection: d3.Selection<Element, unknown, null, undefined>): d3.Transition<Element, unknown, null, undefined> => {
    return selection.transition()
      .duration(750)
      .ease(d3.easeCircleInOut);
  },

  /**
   * Generate a color palette
   */
  generateColorPalette: (count: number): string[] => {
    // Use built-in schemes if count is small enough
    if (count <= 10) {
      return d3.schemeCategory10.slice(0, count);
    } else if (count <= 20) {
      // Combine schemes for larger sets
      return [...d3.schemeCategory10, ...d3.schemeSet3.slice(0, count - 10)];
    } else {
      // Generate colors programmatically for very large sets
      return Array.from({ length: count }, (_, i) => 
        d3.interpolateSpectral(i / (count - 1))
      );
    }
  }
};

export default d3Utils;