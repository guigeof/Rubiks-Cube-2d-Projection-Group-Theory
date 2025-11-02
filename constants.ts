import type { CubeState, Color, GraphNode, GraphEdge, FaceName, Sticker } from './types';

export const COLORS: Record<Color, string> = {
  R: 'bg-red-500',      // Red
  G: 'bg-green-500',    // Green
  B: 'bg-blue-500',     // Blue
  Y: 'bg-yellow-400',   // Yellow
  O: 'bg-orange-500',   // Orange
  W: 'bg-white',        // White
};

export const SVG_COLORS: Record<Color, string> = {
  R: '#ef4444',
  G: '#22c55e',
  B: '#3b82f6',
  Y: '#facc15',
  O: '#f97316',
  W: '#ffffff',
};

const createFace = (color: Color, faceName: FaceName): Sticker[][] => 
  Array(3).fill(null).map((_, rowIndex) => 
    Array(3).fill(null).map((_, colIndex) => ({ 
      id: `${faceName}_${rowIndex}_${colIndex}`,
      color, 
      rotation: 0 
    }))
  );

export const INITIAL_CUBE_STATE: CubeState = {
  U: createFace('Y', 'U'),
  D: createFace('W', 'D'),
  L: createFace('B', 'L'),
  R: createFace('G', 'R'),
  F: createFace('R', 'F'),
  B: createFace('O', 'B'),
};

export const CUBE_PIECES: string[][] = [
  // Centers
  ['U_1_1'], ['D_1_1'], ['L_1_1'], ['R_1_1'], ['F_1_1'], ['B_1_1'],
  // Edges
  ['U_0_1', 'B_0_1'], ['U_1_2', 'R_0_1'], ['U_2_1', 'F_0_1'], ['U_1_0', 'L_0_1'],
  ['D_0_1', 'F_2_1'], ['D_1_2', 'R_2_1'], ['D_2_1', 'B_2_1'], ['D_1_0', 'L_2_1'],
  ['F_1_0', 'L_1_2'], ['F_1_2', 'R_1_0'], ['B_1_0', 'R_1_2'], ['B_1_2', 'L_1_0'],
  // Corners
  ['U_0_0', 'L_0_0', 'B_0_2'], ['U_0_2', 'B_0_0', 'R_0_2'],
  ['U_2_0', 'L_0_2', 'F_0_0'], ['U_2_2', 'F_0_2', 'R_0_0'],
  ['D_0_0', 'F_2_0', 'L_2_2'], ['D_0_2', 'R_2_0', 'F_2_2'],
  ['D_2_0', 'L_2_0', 'B_2_2'], ['D_2_2', 'B_2_0', 'R_2_2'],
];

export const BLD_ALPHABET: Record<string, string> = {
  // U Face Stickers (A-H)
  'U_0_0': 'A', 'U_0_1': 'B', 'U_0_2': 'C', 'U_1_0': 'D', /* U_1_1 is center */ 'U_1_2': 'E', 'U_2_0': 'F', 'U_2_1': 'G', 'U_2_2': 'H',
  // L Face Stickers (I-P)
  'L_0_0': 'I', 'L_0_1': 'J', 'L_0_2': 'K', 'L_1_0': 'L', /* L_1_1 is center */ 'L_1_2': 'M', 'L_2_0': 'N', 'L_2_1': 'O', 'L_2_2': 'P',
  // F Face Stickers (Q-X)
  'F_0_0': 'Q', 'F_0_1': 'R', 'F_0_2': 'S', 'F_1_0': 'T', /* F_1_1 is center */ 'F_1_2': 'U', 'F_2_0': 'V', 'F_2_1': 'W', 'F_2_2': 'X',
  // R Face Stickers (a-h)
  'R_0_0': 'a', 'R_0_1': 'b', 'R_0_2': 'c', 'R_1_0': 'd', /* R_1_1 is center */ 'R_1_2': 'e', 'R_2_0': 'f', 'R_2_1': 'g', 'R_2_2': 'h',
  // B Face Stickers (i-p)
  'B_0_0': 'i', 'B_0_1': 'j', 'B_0_2': 'k', 'B_1_0': 'l', /* B_1_1 is center */ 'B_1_2': 'm', 'B_2_0': 'n', 'B_2_1': 'o', 'B_2_2': 'p',
  // D Face Stickers (q-x)
  'D_0_0': 'q', 'D_0_1': 'r', 'D_0_2': 's', 'D_1_0': 't', /* D_1_1 is center */ 'D_1_2': 'u', 'D_2_0': 'v', 'D_2_1': 'w', 'D_2_2': 'x',
};

export const GRAPH_CENTER = { x: 200, y: 200 };
export const GRAPH_RADII = [120, 145, 170];

const generateGraphLayout = () => {
  const nodes: GraphNode[] = [];
  const circles: GraphEdge[] = [];
  const stickerMap: number[] = Array(54);
  let nodeId = 0;

  // Enforce perfect ternary symmetry by calculating centers based on polar coordinates
  const center_dist = 90;
  const centers = {
    U: { x: GRAPH_CENTER.x, y: GRAPH_CENTER.y - center_dist },
    F: { 
      x: GRAPH_CENTER.x + center_dist * Math.cos(150 * Math.PI / 180), // 150 degrees from positive x-axis
      y: GRAPH_CENTER.y + center_dist * Math.sin(150 * Math.PI / 180) 
    },
    R: { 
      x: GRAPH_CENTER.x + center_dist * Math.cos(30 * Math.PI / 180), // 30 degrees from positive x-axis
      y: GRAPH_CENTER.y + center_dist * Math.sin(30 * Math.PI / 180)
    },
  };
  const radii = GRAPH_RADII;

  (Object.keys(centers) as ('U' | 'F' | 'R')[]).forEach(faceName => {
    const center = centers[faceName];
    radii.forEach(r => {
      circles.push({ cx: center.x, cy: center.y, r, face: faceName });
    });
  });

  const distSq = (p1: {x:number, y:number}, p2: {x:number, y:number}) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;

  const getCircleIntersections = (
    p1: { x: number; y: number }, r1: number,
    p2: { x: number; y: number }, r2: number
  ): { x: number; y: number }[] => {
    const d_sq = distSq(p1, p2);
    if (d_sq === 0) return [];
    const d = Math.sqrt(d_sq);
    if (d > r1 + r2 || d < Math.abs(r1 - r2)) return [];

    const a = (r1 * r1 - r2 * r2 + d_sq) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const x2 = p1.x + a * (p2.x - p1.x) / d;
    const y2 = p1.y + a * (p2.y - p1.y) / d;

    return [
      { x: x2 + h * (p2.y - p1.y) / d, y: y2 - h * (p2.x - p1.x) / d },
      { x: x2 - h * (p2.y - p1.y) / d, y: y2 + h * (p2.x - p1.x) / d },
    ];
  };
  
  type NodeInfo = { pos: {x: number, y: number}, u_idx: number, r_idx: number, f_idx: number };
  const nodeGroups: Record<FaceName, NodeInfo[]> = { U: [], D: [], L: [], R: [], F: [], B: [] };

  // U-R intersections -> F/B faces
  for (let u_idx = 0; u_idx < 3; u_idx++) {
    for (let r_idx = 0; r_idx < 3; r_idx++) {
      const ints = getCircleIntersections(centers.U, radii[u_idx], centers.R, radii[r_idx]);
      if (ints.length !== 2) continue;
      const data = { u_idx, r_idx, f_idx: -1 };
      if (distSq(ints[0], centers.F) < distSq(ints[1], centers.F)) {
        nodeGroups.F.push({ pos: ints[0], ...data }); nodeGroups.B.push({ pos: ints[1], ...data });
      } else {
        nodeGroups.F.push({ pos: ints[1], ...data }); nodeGroups.B.push({ pos: ints[0], ...data });
      }
    }
  }

  // U-F intersections -> R/L faces
  for (let u_idx = 0; u_idx < 3; u_idx++) {
    for (let f_idx = 0; f_idx < 3; f_idx++) {
      const ints = getCircleIntersections(centers.U, radii[u_idx], centers.F, radii[f_idx]);
       if (ints.length !== 2) continue;
       const data = { u_idx, f_idx, r_idx: -1 };
       if (distSq(ints[0], centers.R) < distSq(ints[1], centers.R)) {
        nodeGroups.R.push({ pos: ints[0], ...data }); nodeGroups.L.push({ pos: ints[1], ...data });
      } else {
        nodeGroups.R.push({ pos: ints[1], ...data }); nodeGroups.L.push({ pos: ints[0], ...data });
      }
    }
  }

  // F-R intersections -> U/D faces
   for (let f_idx = 0; f_idx < 3; f_idx++) {
    for (let r_idx = 0; r_idx < 3; r_idx++) {
      const ints = getCircleIntersections(centers.F, radii[f_idx], centers.R, radii[r_idx]);
       if (ints.length !== 2) continue;
       const data = { f_idx, r_idx, u_idx: -1 };
       if (distSq(ints[0], centers.U) < distSq(ints[1], centers.U)) {
        nodeGroups.U.push({ pos: ints[0], ...data }); nodeGroups.D.push({ pos: ints[1], ...data });
      } else {
        nodeGroups.U.push({ pos: ints[1], ...data }); nodeGroups.D.push({ pos: ints[0], ...data });
      }
    }
  }
  
  const CUBE_FACE_ORDER: FaceName[] = ['U', 'L', 'F', 'R', 'B', 'D'];
  const faceToStickerStartIndex: Record<FaceName, number> = { U: 0, L: 9, F: 18, R: 27, B: 36, D: 45 };
  
  CUBE_FACE_ORDER.forEach(faceName => {
    const faceNodes = nodeGroups[faceName];
    let sortedNodes: NodeInfo[];

    // This sorting logic is crucial. It maps the physical layout of stickers on each face
    // (iterated row-by-row, col-by-col) to the geometric layout of the graph nodes, 
    // ensuring piece integrity is visually maintained.
    switch(faceName) {
        case 'U': // Maps sticker(row,col) to node(f=2-row, r=2-col)
            sortedNodes = faceNodes.sort((a, b) => (b.f_idx - a.f_idx) * 10 + (b.r_idx - a.r_idx));
            break;
        case 'D': // Maps sticker(row,col) to node(f=row, r=2-col)
             sortedNodes = faceNodes.sort((a, b) => (a.f_idx - b.f_idx) * 10 + (b.r_idx - a.r_idx));
            break;
        case 'F': // Maps sticker(row,col) to node(u=row, r=2-col)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (b.r_idx - a.r_idx));
            break;
        case 'B': // Maps sticker(row,col) to node(u=row, r=col)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (a.r_idx - b.r_idx));
            break;
        case 'R': // Maps sticker(row,col) to node(u=row, f=col)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (a.f_idx - b.f_idx));
            break;
        case 'L': // Maps sticker(row,col) to node(u=row, f=2-col)
             sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (b.f_idx - a.f_idx));
            break;
        default:
            sortedNodes = [];
    }

    for (let i = 0; i < 9; i++) {
      const node = sortedNodes[i];
      if (!node) continue;
      nodes.push({ id: nodeId, cx: node.pos.x, cy: node.pos.y });
      stickerMap[nodeId] = faceToStickerStartIndex[faceName] + i;
      nodeId++;
    }
  });

  const stickerGroupAngles: Record<'U' | 'F' | 'R', Record<string, number>> = { U: {}, F: {}, R: {} };
  
  const getGroupAngle = (faceName: FaceName, center: {x: number, y: number}): number => {
    const faceNodes = nodeGroups[faceName];
    if (!faceNodes || faceNodes.length === 0) return 0;
    const avgPos = faceNodes.reduce((acc, node) => ({x: acc.x + node.pos.x, y: acc.y + node.pos.y}), {x: 0, y: 0});
    avgPos.x /= faceNodes.length;
    avgPos.y /= faceNodes.length;
    return Math.atan2(avgPos.y - center.y, avgPos.x - center.x);
  };
  
  const uAdjacent: FaceName[] = ['F', 'R', 'B', 'L'];
  uAdjacent.forEach(fn => {
    stickerGroupAngles.U[fn] = getGroupAngle(fn, centers.U);
  });
  
  const fAdjacent: FaceName[] = ['U', 'L', 'D', 'R'];
   fAdjacent.forEach(fn => {
    stickerGroupAngles.F[fn] = getGroupAngle(fn, centers.F);
  });
  
  const rAdjacent: FaceName[] = ['U', 'B', 'D', 'F'];
  rAdjacent.forEach(fn => {
    stickerGroupAngles.R[fn] = getGroupAngle(fn, centers.R);
  });

  const stickerZoneBoundaries: Record<'U' | 'F' | 'R', number[]> = { U: [], F: [], R: [] };
  const STICKER_ZONE_ANGULAR_WIDTH = Math.PI / 4; // 45 degrees

  const normalizeAngleTo2Pi = (angle: number): number => {
      while (angle < 0) angle += 2 * Math.PI;
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
      return angle;
  };

  for (const face of (['U', 'F', 'R'] as const)) {
      const angles = Object.values(stickerGroupAngles[face]).sort((a, b) => a - b);
      const boundaries: number[] = [];
      for (const angle of angles) {
          boundaries.push(normalizeAngleTo2Pi(angle - STICKER_ZONE_ANGULAR_WIDTH / 2));
          boundaries.push(normalizeAngleTo2Pi(angle + STICKER_ZONE_ANGULAR_WIDTH / 2));
      }
      stickerZoneBoundaries[face] = boundaries.sort((a, b) => a - b);
  }

  return { nodes, circles, stickerMap, stickerGroupAngles, stickerZoneBoundaries, centers };
};


const { nodes, circles, stickerMap, stickerGroupAngles, stickerZoneBoundaries, centers } = generateGraphLayout();
export const GRAPH_NODES = nodes;
export const GRAPH_CIRCLES = circles;
export const STICKER_TO_NODE_MAP = stickerMap;
export const GRAPH_STICKER_GROUP_ANGLES = stickerGroupAngles;
export const GRAPH_STICKER_ZONE_BOUNDARIES = stickerZoneBoundaries;
export const GRAPH_CENTERS = centers;