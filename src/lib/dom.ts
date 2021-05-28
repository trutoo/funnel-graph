type Attributes = Record<string, string>;

const setAttrs = (element: Element, attributes: Attributes) => {
  if (typeof attributes === 'object') {
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
  }
};

const removeAttrs = (element: Element, ...attributes: string[]) => {
  attributes.forEach((attribute) => {
    element.removeAttribute(attribute);
  });
};

const createSVGElement = <K extends keyof SVGElementTagNameMap>(
  element: K,
  container?: Element | null,
  attributes?: Attributes,
): SVGElementTagNameMap[K] => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', element);

  if (typeof attributes === 'object') {
    setAttrs(el, attributes);
  }

  if (container) {
    container.appendChild(el);
  }

  return el;
};

const generateLegendBackground = (color: string | string[], direction = 'horizontal') => {
  if (typeof color === 'string') {
    return `background-color: ${color}`;
  }

  if (color.length === 1) {
    return `background-color: ${color[0]}`;
  }

  return `background-image: linear-gradient(${direction === 'horizontal' ? 'to right, ' : ''}${color.join(', ')})`;
};

const defaultColors = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];

const getDefaultColors = (sets: number) => {
  if (sets == 1) return [defaultColors[0], defaultColors[3]];
  const colors = [];
  const len = defaultColors.length;
  for (let i = 0; i < sets; i++) {
    const colorIndex = Math.round((len / Math.min(sets, len)) * (i % len));
    colors.push(defaultColors[colorIndex]);
  }
  return colors;
};

/*
    Used in comparing existing values to value provided on update
    It is limited to comparing arrays on purpose
    Name is slightly unusual, in order not to be confused with Lodash method
 */
const areEqual = (value: any, newValue: any) => {
  // If values are not of the same type
  const type = Object.prototype.toString.call(value);
  if (type !== Object.prototype.toString.call(newValue)) return false;
  if (type !== '[object Array]') return false;

  if (value.length !== newValue.length) return false;

  for (let i = 0; i < value.length; i++) {
    // if the it's a two dimensional array
    const currentType = Object.prototype.toString.call(value[i]);
    if (currentType !== Object.prototype.toString.call(newValue[i])) return false;
    if (currentType === '[object Array]') {
      // if row lengths are not equal then arrays are not equal
      if (value[i].length !== newValue[i].length) return false;
      // compare each element in the row
      for (let j = 0; j < value[i].length; j++) {
        if (value[i][j] !== newValue[i][j]) {
          return false;
        }
      }
    } else if (value[i] !== newValue[i]) {
      // if it's a one dimensional array element
      return false;
    }
  }

  return true;
};

export { areEqual, createSVGElement, defaultColors, generateLegendBackground, getDefaultColors, removeAttrs, setAttrs };
