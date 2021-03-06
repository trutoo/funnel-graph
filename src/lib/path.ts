import { roundPoint } from './number';

export const createCurves = (x1: number, y1: number, x2: number, y2: number) =>
  ` C${roundPoint((x2 + x1) / 2)},${y1} ` + `${roundPoint((x2 + x1) / 2)},${y2} ${x2},${y2}`;

export const createVerticalCurves = (x1: number, y1: number, x2: number, y2: number) =>
  ` C${x1},${roundPoint((y2 + y1) / 2)} ` + `${x2},${roundPoint((y2 + y1) / 2)} ${x2},${y2}`;

/*
    A funnel segment is draw in a clockwise direction.
    Path 1-2 is drawn,
    then connected with a straight vertical line 2-3,
    then a line 3-4 is draw (using YNext points going in backwards direction)
    then path is closed (connected with the starting point 1).

    1---------->2
    ^           |
    |           v
    4<----------3

    On the graph on line 20 it works like this:
    A#0, A#1, A#2, A#3, B#3, B#2, B#1, B#0, close the path.

    Points for path "B" are passed as the YNext param.
 */

export const createPath = (X: number[], Y: number[], YNext: number[]) => {
  let str = `M${X[0]},${Y[0]}`;

  for (let i = 0; i < X.length - 1; i++) {
    str += createCurves(X[i], Y[i], X[i + 1], Y[i + 1]);
  }

  str += ` L${[...X].pop()},${[...YNext].pop()}`;

  for (let i = X.length - 1; i > 0; i--) {
    str += createCurves(X[i], YNext[i], X[i - 1], YNext[i - 1]);
  }

  str += ' Z';

  return str;
};

/*
    In a vertical path we go counter-clockwise

    1<----------4
    |           ^
    v           |
    2---------->3
 */

export const createVerticalPath = (X: number[], XNext: number[], Y: number[]) => {
  let str = `M${X[0]},${Y[0]}`;

  for (let i = 0; i < X.length - 1; i++) {
    str += createVerticalCurves(X[i], Y[i], X[i + 1], Y[i + 1]);
  }

  str += ` L${[...XNext].pop()},${[...Y].pop()}`;

  for (let i = X.length - 1; i > 0; i--) {
    str += createVerticalCurves(XNext[i], Y[i], XNext[i - 1], Y[i - 1]);
  }

  str += ' Z';

  return str;
};
