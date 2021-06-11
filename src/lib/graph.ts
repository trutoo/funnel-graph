import { createSVGElement, generateLegendBackground, getDefaultColors, removeAttrs, setAttrs } from './dom';
import { formatNumber, roundPoint } from './number';
import { createPath, createVerticalPath } from './path';
import { generateCrossAxisPoints, generateMainAxisPoints, layerMaxLength, layerPercentages, layerSums } from './points';
import { Direction, FunnelData, FunnelDataLayered, FunnelOptions, isLayered } from './types';

export class FunnelGraph {
  private container: Element | null = null;
  private graphContainer: HTMLDivElement | null = null;
  private containerSelector = '';
  private data: FunnelData | FunnelDataLayered;
  private gradientDirection: Direction;
  private direction: Direction;
  private displayPercent: boolean;
  private width: number;
  private height: number;
  private subLabelValue: string;

  constructor(options: FunnelOptions) {
    if (options.container instanceof Element) this.container = options.container;
    else this.containerSelector = options.container;
    const colors = getDefaultColors(isLayered(options.data) ? layerMaxLength(options.data) : 1);
    this.data = {
      labels: [],
      colors,
      subLabels: [],
      ...options.data,
    };
    this.gradientDirection =
      options.gradientDirection && options.gradientDirection === 'vertical' ? 'vertical' : 'horizontal';
    this.direction = options.direction && options.direction === 'vertical' ? 'vertical' : 'horizontal';
    this.displayPercent = options.displayPercent || false;
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.subLabelValue = options.subLabelValue || 'percent';
  }

  //------------------------------------------------------------------------------------
  // RENDER
  //------------------------------------------------------------------------------------

  private createContainer() {
    if (!this.container) {
      if (!this.containerSelector) {
        throw new Error('Container must either be a selector string or an Element.');
      }

      this.container = document.querySelector(this.containerSelector);
      if (!this.container) {
        throw new Error(`Container cannot be found (selector: ${this.containerSelector}).`);
      }
    }

    this.container.classList.add('fg');

    this.graphContainer = document.createElement('div');
    this.graphContainer.classList.add('fg-container');
    this.container.appendChild(this.graphContainer);

    if (this.direction === 'vertical') {
      this.container.classList.add('fg--vertical');
    }
  }

  private makeSVG() {
    if (!this.graphContainer) return;

    let svg = this.graphContainer.querySelector('svg');
    if (!svg) {
      svg = createSVGElement('svg', this.graphContainer, {
        width: this.getWidth().toString(),
        height: this.getHeight().toString(),
      });
      this.graphContainer.appendChild(svg);
    }

    const paths = svg.querySelectorAll('path');
    const valuesNum = this.getCrossAxisPoints().length - 1;

    for (let i = 0; i < valuesNum; i++) {
      let path = paths[i];
      if (!path) {
        path = createSVGElement('path', svg);
        svg.appendChild(path);
      }

      const color = isLayered(this.data) ? this.data.colors[i] : this.data.colors;
      const fillMode = typeof color === 'string' || color.length === 1 ? 'solid' : 'gradient';

      if (fillMode === 'solid') {
        setAttrs(path, {
          fill: Array.isArray(color) ? color[0] : color,
          stroke: Array.isArray(color) ? color[0] : color,
        });
      } else if (fillMode === 'gradient') {
        this.applyGradient(svg, path, color as string[], i + 1);
      }
    }

    for (let i = valuesNum; i < paths.length; i++) {
      paths[i].remove();
    }
  }

  private drawPaths() {
    const svg = this.getSVG();
    if (!svg) return;
    const paths = svg.querySelectorAll('path');
    const definitions = this.getPathDefinitions();

    definitions.forEach((definition, index) => {
      paths[index].setAttribute('d', definition);
    });
  }

  private addLabels() {
    if (!this.container) return;
    const holder = document.createElement('div');
    holder.setAttribute('class', 'fg-labels');

    const percentages = this.getPercentages();
    percentages.forEach((percentage, index) => {
      const labelElement = document.createElement('div');
      labelElement.setAttribute('class', `fg-label`);

      const title = document.createElement('div');
      title.setAttribute('class', 'fg-label__title');
      title.textContent = this.data.labels[index] || '';

      const value = document.createElement('div');
      value.setAttribute('class', 'fg-label__value');

      const valueNumber = isLayered(this.data) ? this.getLayerSums()[index] : this.data.values[index];
      value.textContent = formatNumber(valueNumber || 0);

      const percentageValue = document.createElement('div');
      percentageValue.setAttribute('class', 'fg-label__percentage');
      percentageValue.textContent = `${percentage.toString()}%`;

      labelElement.appendChild(value);
      labelElement.appendChild(title);
      if (this.displayPercent) {
        labelElement.appendChild(percentageValue);
      }

      if (isLayered(this.data) && this.data.subLabels?.length) {
        const segmentPercentages = document.createElement('div');
        segmentPercentages.setAttribute('class', 'fg-label__segments');
        let percentageList = '<ul class="fg-label__segment-list">';

        const twoDimPercentages = this.getLayerPercentages();

        this.data.subLabels.forEach((subLabel, j) => {
          const data = this.data as FunnelDataLayered;
          const subLabelDisplayValue =
            this.subLabelValue === 'percent'
              ? `${twoDimPercentages[index][j]}%`
              : formatNumber(data.values[index][j] || 0);
          percentageList += `
            <li class="fg-label__segment-item">${subLabel}:
              <span class="fg-label__segment-label">${subLabelDisplayValue}</span>
            </li>`;
        });
        percentageList += '</ul>';
        segmentPercentages.innerHTML = percentageList;
        labelElement.appendChild(segmentPercentages);
      }

      holder.appendChild(labelElement);
    });

    this.container.appendChild(holder);
  }

  private addSubLabels() {
    if (!this.container || !isLayered(this.data) || !this.data.subLabels?.length) return;
    const subLabelsHolder = document.createElement('div');
    subLabelsHolder.setAttribute('class', 'fg-sub-labels');

    let subLabelsHTML = '';

    this.data.subLabels.forEach((subLabel, index) => {
      if (!this.data.colors) return;
      subLabelsHTML += `
      <div class="fg-sub-label">
        <div class="fg-sub-label__color"
          style="${generateLegendBackground(this.data.colors[index], this.gradientDirection)}"></div>
        <div class="fg-sub-label__title">${subLabel}</div>
      </div>`;
    });

    subLabelsHolder.innerHTML = subLabelsHTML;
    this.container.appendChild(subLabelsHolder);
  }

  private applyGradient(svg: Element, path: Element, colors: string[], index = 0) {
    let defs = svg.querySelector('defs');
    if (!defs) defs = createSVGElement('defs', svg);

    const gradientName = `funnelGradient-${index}`;

    let gradient = defs.querySelector(`#${gradientName}`);
    if (!gradient) {
      gradient = createSVGElement('linearGradient', defs, {
        id: gradientName,
      });
    }

    if (this.gradientDirection === 'vertical') {
      setAttrs(gradient, {
        x1: '0',
        x2: '0',
        y1: '0',
        y2: '1',
      });
    }

    const stops = gradient.querySelectorAll(`stop`);
    const numberOfColors = colors.length;
    for (let i = 0; i < numberOfColors; i++) {
      const stop = stops[i];
      const attributes = {
        'stop-color': colors[i],
        offset: `${Math.round((100 * i) / (numberOfColors - 1))}%`,
      };
      if (stop) {
        setAttrs(stop, attributes);
      } else {
        createSVGElement('stop', gradient, attributes);
      }
    }

    for (let i = numberOfColors; i < stops.length; i++) {
      stops[i].remove();
    }

    setAttrs(path, {
      fill: `url("#${gradientName}")`,
      stroke: `url("#${gradientName}")`,
    });
  }

  //------------------------------------------------------------------------------------
  // GETTERS
  //------------------------------------------------------------------------------------

  getMainAxisPoints() {
    const fullDimension = this.isVertical() ? this.getHeight() : this.getWidth();
    return generateMainAxisPoints(this.data, fullDimension);
  }

  getCrossAxisPoints() {
    const fullDimension = this.isVertical() ? this.getWidth() : this.getHeight();
    return generateCrossAxisPoints(this.data, fullDimension);
  }

  getGraphType() {
    return isLayered(this.data) ? 'layered' : 'normal';
  }

  isVertical() {
    return this.direction === 'vertical';
  }

  getDataSize() {
    return this.data.values.length;
  }

  getSubDataSize() {
    if (Array.isArray(this.data.values[0])) return this.data.values[0].length;
    return 0;
  }

  getFullDimension() {
    return this.isVertical() ? this.getHeight() : this.getWidth();
  }

  setValues(values: number[] | number[][]) {
    this.data.values = values;
    return this;
  }

  setDirection(direction: Direction) {
    this.direction = direction;
    return this;
  }

  setHeight(height: number) {
    this.height = height;
    return this;
  }

  setWidth(width: number) {
    this.width = width;
    return this;
  }

  getLayerSums() {
    if (!isLayered(this.data)) return [];
    return layerSums(this.data);
  }

  getLayerPercentages() {
    if (!isLayered(this.data)) return [];
    return layerPercentages(this.data);
  }

  getPercentages() {
    let values: number[] | number[][] = [];

    if (isLayered(this.data)) {
      values = this.getLayerSums();
    } else {
      values = [...this.data.values];
    }

    const max = Math.max(...values);
    return values.map((value) => (value === 0 ? 0 : roundPoint((value * 100) / max)));
  }

  getSVG() {
    if (!this.container) return;
    const svg = this.container.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG found inside of the container');
    }
    return svg;
  }

  getWidth() {
    return this.width || this.graphContainer?.clientWidth || 0;
  }

  getHeight() {
    return this.height || this.graphContainer?.clientHeight || 0;
  }

  getPathDefinitions() {
    const crossAxisPoints = this.getCrossAxisPoints();
    const valuesNum = crossAxisPoints.length - 1;
    const paths = [];
    for (let i = 0; i < valuesNum; i++) {
      if (this.isVertical()) {
        const x = crossAxisPoints[i];
        const xNext = crossAxisPoints[i + 1];
        const y = this.getMainAxisPoints();

        const d = createVerticalPath(x, xNext, y);
        paths.push(d);
      } else {
        const x = this.getMainAxisPoints();
        const y = crossAxisPoints[i];
        const yNext = crossAxisPoints[i + 1];

        const d = createPath(x, y, yNext);
        paths.push(d);
      }
    }

    return paths;
  }

  getPathMedian(i: number) {
    const crossAxisPoints = this.getCrossAxisPoints();
    if (this.isVertical()) {
      const cross = crossAxisPoints[i];
      const next = crossAxisPoints[i + 1];
      const y = this.getMainAxisPoints();
      const x: number[] = [];
      const xNext: number[] = [];

      cross.forEach((point, index) => {
        const m = (point + next[index]) / 2;
        x.push(m - 1);
        xNext.push(m + 1);
      });

      return createVerticalPath(x, xNext, y);
    }

    const x = this.getMainAxisPoints();
    const cross = crossAxisPoints[i];
    const next = crossAxisPoints[i + 1];
    const y: number[] = [];
    const yNext: number[] = [];

    cross.forEach((point, index) => {
      const m = (point + next[index]) / 2;
      y.push(m - 1);
      yNext.push(m + 1);
    });

    return createPath(x, y, yNext);
  }

  //------------------------------------------------------------------------------------
  // PUBLIC API
  //------------------------------------------------------------------------------------

  makeVertical() {
    const svg = this.getSVG();
    if (!this.container || !svg) return;
    if (this.direction === 'vertical') return true;

    this.direction = 'vertical';
    this.container.classList.add('fg--vertical');

    const height = this.getHeight().toString();
    const width = this.getWidth().toString();
    setAttrs(svg, { height, width });

    this.drawPaths();
    return true;
  }

  makeHorizontal() {
    const svg = this.getSVG();
    if (!this.container || !svg) return;
    if (this.direction === 'horizontal') return true;

    this.direction = 'horizontal';
    this.container.classList.remove('fg--vertical');

    const height = this.getHeight().toString();
    const width = this.getWidth().toString();
    setAttrs(svg, { height, width });

    this.drawPaths();
    return true;
  }

  toggleDirection() {
    if (this.direction === 'horizontal') {
      this.makeVertical();
    } else {
      this.makeHorizontal();
    }
  }

  gradientMakeVertical() {
    if (!this.graphContainer) return false;
    if (this.gradientDirection === 'vertical') return true;

    this.gradientDirection = 'vertical';
    const gradients = this.graphContainer.querySelectorAll('linearGradient');

    for (let i = 0; i < gradients.length; i++) {
      setAttrs(gradients[i], {
        x1: '0',
        x2: '0',
        y1: '0',
        y2: '1',
      });
    }
    return true;
  }

  gradientMakeHorizontal() {
    if (!this.graphContainer) return false;
    if (this.gradientDirection === 'horizontal') return true;

    this.gradientDirection = 'horizontal';
    const gradients = this.graphContainer.querySelectorAll('linearGradient');

    for (let i = 0; i < gradients.length; i++) {
      removeAttrs(gradients[i], 'x1', 'x2', 'y1', 'y2');
    }
    return true;
  }

  gradientToggleDirection() {
    if (this.gradientDirection === 'horizontal') {
      this.gradientMakeVertical();
    } else {
      this.gradientMakeHorizontal();
    }
  }

  updateWidth(width: number) {
    const svg = this.getSVG();
    if (!svg) return;
    this.width = width;
    setAttrs(svg, { width: width.toString() });
    this.drawPaths();
    return true;
  }

  updateHeight(height: number) {
    const svg = this.getSVG();
    if (!svg) return;
    this.height = height;
    setAttrs(svg, { height: height.toString() });
    this.drawPaths();
    return true;
  }

  updateData(data: Partial<FunnelData | FunnelDataLayered>, reset = false) {
    if (!this.container) return;

    let redraw = false;

    if (reset) {
      this.data = {
        values: [],
        labels: [],
        subLabels: [],
        colors: [],
      };
      redraw = true;
    }

    if (data.colors) {
      this.data.colors = data.colors;
      redraw = true;
    } else if (data.values && data.values.length != this.data.values.length) {
      this.data.colors = getDefaultColors(isLayered(data) ? layerMaxLength(data) : 1);
      redraw = true;
    }

    if (data.values) {
      this.data.values = data.values;
      redraw = true;
    }

    if (data.labels) {
      const labels = this.container.querySelector('.fg-labels');
      if (labels) labels.remove();
      this.data.labels = data.labels;
      this.addLabels();
    }

    if (isLayered(data) && data.subLabels) {
      const subLabels = this.container.querySelector('.fg-sub-labels');
      if (subLabels) subLabels.remove();
      (this.data as FunnelDataLayered).subLabels = data.subLabels;
      this.addSubLabels();
    }

    if (redraw) {
      this.makeSVG();
      this.drawPaths();
    }
  }

  update(options: FunnelOptions) {
    if (!this.container) return;
    if (typeof options.displayPercent !== 'undefined') {
      if (this.displayPercent !== options.displayPercent) {
        if (this.displayPercent === true) {
          this.container.querySelectorAll('.fg-label__percentage').forEach((label) => {
            label.remove();
          });
        } else {
          const percentages = this.getPercentages();
          this.container.querySelectorAll('.fg-label').forEach((label, index) => {
            const percentage = percentages[index];
            const percentageValue = document.createElement('div');
            percentageValue.setAttribute('class', 'fg-label__percentage');

            if (percentage !== 100) {
              percentageValue.textContent = `${percentage.toString()}%`;
              label.appendChild(percentageValue);
            }
          });
        }
      }
    }
    if (typeof options.height !== 'undefined') {
      this.updateHeight(options.height);
    }
    if (typeof options.width !== 'undefined') {
      this.updateWidth(options.width);
    }
    if (typeof options.gradientDirection !== 'undefined') {
      if (options.gradientDirection === 'vertical') {
        this.gradientMakeVertical();
      } else if (options.gradientDirection === 'horizontal') {
        this.gradientMakeHorizontal();
      }
    }
    if (typeof options.direction !== 'undefined') {
      if (options.direction === 'vertical') {
        this.makeVertical();
      } else if (options.direction === 'horizontal') {
        this.makeHorizontal();
      }
    }
    if (typeof options.data !== 'undefined') {
      this.updateData(options.data);
    }
  }

  draw() {
    this.createContainer();
    this.makeSVG();

    this.addLabels();

    if (isLayered(this.data)) {
      this.addSubLabels();
    }

    this.drawPaths();
  }
}
