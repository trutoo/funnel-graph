export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type Direction = 'horizontal' | 'vertical';

export type FunnelData = {
  labels: string[];
  colors: string | string[];
  values: number[];
};

export type FunnelDataLayered = {
  labels: string[];
  subLabels: string[];
  colors: (string | string[])[];
  values: number[][];
};

export const isLayered = (data: Partial<FunnelData | FunnelDataLayered>): data is FunnelDataLayered => {
  return !!data.values && Array.isArray(data.values[0]);
};

export interface FunnelOptions {
  container: string | Element;
  data: Optional<FunnelData, 'labels' | 'colors'> | Optional<FunnelDataLayered, 'labels' | 'colors' | 'subLabels'>;
  gradientDirection?: Direction;
  direction?: Direction;
  displayPercent?: boolean;
  width?: number;
  height?: number;
  subLabelValue?: 'percent' | 'raw';
}
