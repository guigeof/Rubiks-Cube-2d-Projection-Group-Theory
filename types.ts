// FIX: Replaced incorrect file content with proper type definitions.
export type Color = 'R' | 'G' | 'B' | 'Y' | 'O' | 'W';

export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export interface Sticker {
  id: string;
  color: Color;
  rotation: number;
}

export type FaceState = Sticker[][];

export type CubeState = Record<FaceName, FaceState>;

export type Move =
  // Face turns
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  // Slice turns
  | 'M' | "M'" | 'M2'
  | 'E' | "E'" | 'E2'
  | 'S' | "S'" | 'S2'
  // Cube rotations
  | 'x' | "x'" | 'x2'
  | 'y' | "y'" | 'y2'
  | 'z' | "z'" | 'z2';

export interface GraphNode {
    id: number;
    cx: number;
    cy: number;
}

export interface GraphEdge {
    cx: number;
    cy: number;
    r: number;
    face: 'U' | 'F' | 'R';
}
