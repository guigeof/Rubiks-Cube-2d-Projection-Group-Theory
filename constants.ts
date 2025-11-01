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

const createFace = (color: Color): Sticker[][] => 
  Array(3).fill(null).map(() => 
    Array(3).fill(null).map(() => ({ color, rotation: 0 }))
  );

export const INITIAL_CUBE_STATE: CubeState = {
  U: createFace('Y'),
  D: createFace('W'),
  L: createFace('B'),
  R: createFace('G'),
  F: createFace('R'),
  B: createFace('O'),
};

const generateGraphLayout = () => {
  const nodes: GraphNode[] = [];
  const circles: GraphEdge[] = [];
  const stickerMap: number[] = Array(54);
  let nodeId = 0;

  // CRITICAL: DO NOT ADJUST these coordinates. They are finely tuned.
  // É PROIBIDO FAZER OUTROS AJUSTES NESSES PONTOS.
  const centers = {
    U: { x: 200, y: 145 },
    F: { x: 145, y: 255 },
    R: { x: 255, y: 255 },
  };
  const radii = [100, 120, 140];

  Object.values(centers).forEach(center => {
    radii.forEach(r => {
      circles.push({ cx: center.x, cy: center.y, r });
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

    switch(faceName) {
        case 'U': // Defines grid by F-circles (rows) and R-circles (cols)
            sortedNodes = faceNodes.sort((a, b) => (a.f_idx - b.f_idx) * 10 + (a.r_idx - b.r_idx));
            break;
        case 'D': // F-circles (rows, inverted), R-circles (cols)
             sortedNodes = faceNodes.sort((a, b) => ((2 - a.f_idx) - (2 - b.f_idx)) * 10 + (a.r_idx - b.r_idx));
            break;
        case 'F': // U-circles (rows), R-circles (cols)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (a.r_idx - b.r_idx));
            break;
        case 'B': // U-circles (rows), R-circles (cols, inverted)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + ((2 - a.r_idx) - (2 - b.r_idx)));
            break;
        case 'R': // U-circles (rows), F-circles (cols, inverted for correct layer mapping)
            sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + ((2 - a.f_idx) - (2 - b.f_idx)));
            break;
        case 'L': // U-circles (rows), F-circles (cols, for correct layer mapping)
             sortedNodes = faceNodes.sort((a, b) => (a.u_idx - b.u_idx) * 10 + (a.f_idx - b.f_idx));
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

  return { nodes, circles, stickerMap };
};


const { nodes, circles, stickerMap } = generateGraphLayout();
export const GRAPH_NODES = nodes;
export const GRAPH_CIRCLES = circles;
export const STICKER_TO_NODE_MAP = stickerMap;
