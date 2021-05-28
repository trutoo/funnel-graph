/* eslint-disable no-undef */

import assert from 'assert';

import { areEqual, generateLegendBackground } from '../lib/dom';
import { FunnelGraph } from '../lib/graph';
import { formatNumber, roundPoint } from '../lib/number';
import { createCurves, createPath, createVerticalCurves } from '../lib/path';
import generateRandomIdString from '../lib/random';

describe('Check randomly generated ids', () => {
  const generatedIds: string[] = [];
  it("don't collide often", () => {
    for (let i = 0; i < 1000; i++) {
      const newlyGeneratedId = generateRandomIdString();
      for (let j = 0; j < generatedIds.length; j++) {
        const previouslyGeneratedId = generatedIds[j];
        assert.notStrictEqual(newlyGeneratedId, previouslyGeneratedId);
      }
      generatedIds.push(newlyGeneratedId);
    }
  });
  it('have correct prefix', () => {
    ['test', '__', '-prefix-'].forEach((prefix) => {
      const generatedId = generateRandomIdString(prefix);
      assert.strictEqual(0, generatedId.indexOf(prefix));
    });
  });
  it('are longer than just the prefix', () => {
    ['test', '__', '-prefix-', ''].forEach((prefix) => {
      const generatedId = generateRandomIdString(prefix);
      assert.strictEqual(true, generatedId.length > prefix.length);
    });
  });
});

describe('Test number functions', () => {
  it('round number test', () => {
    assert.strictEqual(roundPoint(19.99999999998), 20);
  });

  it('number format test', () => {
    assert.strictEqual(formatNumber(12500), '12,500');
  });
});

describe('Add tests for paths', () => {
  it('can create points for curves', () => {
    assert.strictEqual(createCurves(0, 0, 6, 2), ' C3,0 3,2 6,2');
  });

  it('can create points for vertical curves', () => {
    assert.strictEqual(createVerticalCurves(0, 0, 6, 2), ' C0,1 6,1 6,2');
  });
});

describe('Add tests for background color generator', () => {
  it('can generate a solid background', () => {
    assert.strictEqual(generateLegendBackground('red'), 'background-color: red');
  });

  it('can generate a solid background from an array with single element', () => {
    assert.strictEqual(generateLegendBackground(['red']), 'background-color: red');
  });

  it('can generate a gradient background', () => {
    assert.strictEqual(
      generateLegendBackground(['red', 'orange']),
      'background-image: linear-gradient(to right, red, orange)',
    );
  });

  it('can generate a vertical gradient background', () => {
    assert.strictEqual(
      generateLegendBackground(['red', 'orange'], 'vertical'),
      'background-image: linear-gradient(red, orange)',
    );
  });
});

describe('Add tests for equality method', () => {
  it('can compare one dimensional arrays', () => {
    assert.strictEqual(areEqual([10, 20, 30], [10, 20, 30]), true);
    assert.notStrictEqual(areEqual([10, 20, 31], [10, 20, 30]), true);
    assert.notStrictEqual(areEqual([10, 20, 30, 40], [10, 20, 30]), true);
  });
  it('can compare two dimensional arrays', () => {
    assert.strictEqual(
      areEqual(
        [
          [10, 20, 30],
          ['a', 'b', 'c'],
          [1, 'b', 0],
        ],
        [
          [10, 20, 30],
          ['a', 'b', 'c'],
          [1, 'b', 0],
        ],
      ),
      true,
    );
    assert.notStrictEqual(
      areEqual(
        [
          [10, 20, 30],
          ['a', 'b', 'c'],
          [1, 'b', 0],
        ],
        [
          [10, 20, 30],
          ['a', 'b', 'c'],
          [1, 'b', 'c'],
        ],
      ),
      true,
    );
  });
});

describe('Add tests for paths', () => {
  const data = {
    labels: ['Impressions', 'Add To Cart', 'Buy'],
    subLabels: ['Direct', 'Social Media', 'Ads', 'Other'],
    colors: [['#FFB178', '#FF78B1', '#FF3C8E'], ['#A0BBFF', '#EC77FF'], ['#A0F9FF', '#B377FF'], '#E478FF'],
    values: [
      [2000, 4000, 6000, 500],
      [3000, 1000, 1700, 600],
      [800, 300, 130, 400],
    ],
  };

  let graph: FunnelGraph;

  beforeEach(() => {
    graph = new FunnelGraph({
      container: '.funnel',
      gradientDirection: 'horizontal',
      data,
      displayPercent: true,
      direction: 'horizontal',
      width: 90,
      height: 60,
    });
  });

  it('can create main axis points for curves', () => {
    assert.deepStrictEqual(graph.getMainAxisPoints(), [0, 30, 60, 90]);
  });

  it('can create main axis points for curves', () => {
    assert.deepStrictEqual(graph.getCrossAxisPoints(), [
      [0, 14.9, 26.1, 26.1],
      [9.6, 29.3, 29.9, 29.9],
      [28.8, 34.1, 31.3, 31.3],
      [57.6, 42.3, 31.9, 31.9],
      [60, 45.1, 33.9, 33.9],
    ]);
  });

  it('can create all paths', () => {
    const length = graph.getCrossAxisPoints().length - 1;
    const paths = [];

    for (let i = 0; i < length; i++) {
      const X = graph.getMainAxisPoints();
      const Y = graph.getCrossAxisPoints()[i];
      const YNext = graph.getCrossAxisPoints()[i + 1];
      const d = createPath(X, Y, YNext);

      paths.push(d);
    }
    assert.deepStrictEqual(paths, [
      'M0,0 C15,0 15,14.9 30,14.9 C45,14.9 45,26.1 60,26.1 C75,26.1 75,26.1 90,26.1 L90,29.9 C75,29.9 75,29.9 60,29.9 C45,29.9 45,29.3 30,29.3 C15,29.3 15,9.6 0,9.6 Z',
      'M0,9.6 C15,9.6 15,29.3 30,29.3 C45,29.3 45,29.9 60,29.9 C75,29.9 75,29.9 90,29.9 L90,31.3 C75,31.3 75,31.3 60,31.3 C45,31.3 45,34.1 30,34.1 C15,34.1 15,28.8 0,28.8 Z',
      'M0,28.8 C15,28.8 15,34.1 30,34.1 C45,34.1 45,31.3 60,31.3 C75,31.3 75,31.3 90,31.3 L90,31.9 C75,31.9 75,31.9 60,31.9 C45,31.9 45,42.3 30,42.3 C15,42.3 15,57.6 0,57.6 Z',
      'M0,57.6 C15,57.6 15,42.3 30,42.3 C45,42.3 45,31.9 60,31.9 C75,31.9 75,31.9 90,31.9 L90,33.9 C75,33.9 75,33.9 60,33.9 C45,33.9 45,45.1 30,45.1 C15,45.1 15,60 0,60 Z',
    ]);
  });

  it('can update data', () => {
    Object.defineProperty(graph, 'container', {
      value: {
        querySelector: jest.fn(),
      },
    });

    const updatedData = {
      values: [
        [3500, 3500, 7500],
        [3300, 5400, 5000],
        [600, 600, 6730],
      ],
    };

    Object.defineProperty(graph, 'data', { value: updatedData });

    assert.deepStrictEqual(graph.getMainAxisPoints(), [0, 30, 60, 90]);
    assert.deepStrictEqual(graph.getCrossAxisPoints(), [
      [0, 1.7, 13.6, 13.6],
      [14.5, 15.3, 16.1, 16.1],
      [29, 37.6, 18.6, 18.6],
      [60, 58.3, 46.4, 46.4],
    ]);
  });
});
