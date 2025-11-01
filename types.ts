export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export type Color = 'R' | 'G' | 'B' | 'Y' | 'O' | 'W';

export interface Sticker {
  color: Color;
  rotation: number; // 0, 90, 180, 270 degrees
}

export type FaceState = Sticker[][];

export type CubeState = Record<FaceName, FaceState>;

export type Move = 
  'U' | "U'" | 'D' | "D'" | 
  'L' | "L'" | 'R' | "R'" | 
  'F' | "F'" | 'B' | "B'" |
  'M' | "M'" | 'E' | "E'" | 'S' | "S'" |
  'x' | "x'" | 'y' | "y'" |
  'z' | "z'";

export interface GraphNode {
  id: number;
  cx: number;
  cy: number;
}

export interface GraphEdge {
  cx: number;
  cy: number;
  r: number;
}
