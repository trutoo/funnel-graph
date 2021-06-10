import { roundPoint } from './number';
import { FunnelData, FunnelDataLayered, isLayered } from './types';

export const layerMaxLength = (data: FunnelDataLayered) => {
  return data.values.reduce((max, valueSet) => {
    return Math.max(max, valueSet.length);
  }, 0);
};

export const layerSums = (data: FunnelDataLayered) => {
  return data.values.map((valueSet) => {
    return valueSet.reduce((sum, value) => sum + (value || 0), 0);
  });
};

export const layerPercentages = (data: FunnelDataLayered) => {
  return data.values.map((valueSet) => {
    const total = valueSet.reduce((sum, value) => sum + (value || 0), 0);
    return valueSet.map((value) => (total === 0 ? 0 : roundPoint(((value || 0) * 100) / total)));
  });
};

/**
 * An example of a two-dimensional funnel graph
 * #0..................
 *                    ...#1................
 *                                        ......
 * #0********************#1**                    #2.........................#3 (A)
 *                           *******************
 *                                               #2*************************#3 (B)
 *                                               #2+++++++++++++++++++++++++#3 (C)
 *                           +++++++++++++++++++
 * #0++++++++++++++++++++#1++                    #2-------------------------#3 (D)
 *                                        ------
 *                    ---#1----------------
 * #0-----------------
 * Main axis is the primary axis of the graph.
 * In a horizontal graph it's the X axis, and Y is the cross axis.
 * However we use the names "main" and "cross" axis,
 * because in a vertical graph the primary axis is the Y axis
 * and the cross axis is the X axis.
 * First step of drawing the funnel graph is getting the coordinates of points,
 * that are used when drawing the paths.
 * There are 4 paths in the example above: A, B, C and D.
 * Such funnel has 3 labels and 3 subLabels.
 * This means that the main axis has 4 points (number of labels + 1)
 * One the ASCII illustrated graph above, those points are illustrated with a # symbol.
 */
export const generateMainAxisPoints = (data: FunnelData | FunnelDataLayered, size: number) => {
  const points = [];
  for (let i = 0; i <= data.values.length; i++) {
    points.push(roundPoint((size * i) / data.values.length));
  }
  return points;
};

export const generateCrossAxisPoints = (data: FunnelData | FunnelDataLayered, size: number) => {
  const points: number[][] = [];
  // get half of the graph container height or width, since funnel shape is symmetric
  // we use this when calculating the "A" shape
  const dimension = size / 2;
  if (isLayered(data)) {
    const totalValues = layerSums(data);
    const max = Math.max(...totalValues);

    // duplicate last value
    totalValues.push([...totalValues].pop() as number);
    // get points for path "A"
    points.push(totalValues.map((value) => roundPoint(((max - value) / max) * dimension)));
    // percentages with duplicated last value
    const percentagesFull = layerPercentages(data);
    const pointsOfFirstPath = points[0];
    const length = layerMaxLength(data);

    for (let i = 1; i < length; i++) {
      const p = points[i - 1];
      const newPoints: number[] = [];

      for (let j = 0; j < data.values.length; j++) {
        const percentage = percentagesFull[j][i - 1] || 0;
        newPoints.push(
          roundPoint(
            // eslint-disable-next-line comma-dangle
            p[j] + (size - pointsOfFirstPath[j] * 2) * (percentage / 100),
          ),
        );
      }

      // duplicate the last value as points #2 and #3 have the same value on the cross axis
      newPoints.push([...newPoints].pop() as number);
      points.push(newPoints);
    }

    // add points for path "D", that is simply the "inverted" path "A"
    points.push(pointsOfFirstPath.map((point) => size - point));
  } else {
    // As you can see on the visualization above points #2 and #3 have the same cross axis coordinate
    // so we duplicate the last value
    const max = Math.max(...data.values);
    const values = [...data.values].concat([...data.values].pop() as number);
    // if the graph is simple (not two-dimensional) then we have only paths "A" and "D"
    // which are symmetric. So we get the points for "A" and then get points for "D" by subtracting "A"
    // points from graph cross dimension length
    points.push(values.map((value) => roundPoint(((max - value) / max) * dimension)));
    points.push(points[0].map((point) => size - point));
  }

  return points;
};
