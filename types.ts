export enum ThingType {
  project = 'project',
  forceSource = 'forceSource'
}

export interface NumberProp {
  name: string;
  value: number;
}

export interface Project {
  id: string;
  name: string;
  numberProps: Array<NumberProp>;
  created: Date;
  lastUpdated: Date;
  // Key: relationship name.
  // Value: List of project ids.
  relationships: Record<string, Array<string>>;
  // d3-force properties:
  index: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ForceSource {
  id: string;
  name: string;
  numberProps: Array<NumberProp>;
  x: number;
  y: number;
  fx: number;
  fy: number;
}

export type Thing = Project | ForceSource;
