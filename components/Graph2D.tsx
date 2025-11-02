import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { CubeState, FaceName, Sticker, Move, GraphEdge } from '../types';
import { GRAPH_NODES, GRAPH_CIRCLES, STICKER_TO_NODE_MAP, SVG_COLORS, BLD_ALPHABET, GRAPH_STICKER_GROUP_ANGLES, GRAPH_STICKER_ZONE_BOUNDARIES, GRAPH_CENTER, GRAPH_CENTERS, GRAPH_RADII } from '../constants';

interface Graph2DProps {
  cubeState: CubeState;
  highlightedIds: Set<string> | null;
  onStickerClick: (stickerId: string) => void;
  showBld: boolean;
  onMove: (move: Move, options?: { playSound?: boolean }) => void;
  playClickSound: (pitch?: number, options?: { duration?: number, volume?: number }) => void;
  showHighlightZones: boolean;
  showEdgeSketches: boolean;
  showNodeCoords: boolean;
  showCornerSketches: boolean;
  showCircleColors: boolean;
}

const FACE_ORDER: FaceName[] = ['U', 'L', 'F', 'R', 'B', 'D'];

// Helper to convert polar coords (angle in rad) to cartesian for SVG paths
const polarToCartesian = (cx: number, cy: number, r: number, angleRad: number) => {
    return {
        cx: cx + r * Math.cos(angleRad),
        cy: cy + r * Math.sin(angleRad),
    };
};

const findStickerById = (id: string, state: CubeState): Sticker | undefined => {
  const [faceName, row, col] = id.split('_');
  if (!faceName || !row || !col) return undefined;
  return state[faceName as FaceName]?.[parseInt(row, 10)]?.[parseInt(col, 10)];
};

const CornerPieceSketch: React.FC<{
  cx: number;
  cy: number;
  rotation: number;
  scale?: number;
  topColor: string;
  leftColor: string;
  rightColor: string;
  isHighlighted?: boolean;
}> = ({ cx, cy, rotation, scale = 0.6, topColor, leftColor, rightColor, isHighlighted = false }) => (
  <g transform={`translate(${cx}, ${cy}) rotate(${rotation}) scale(${scale})`}>
    {/* top face */}
    <polygon points="0,-21 -15,-11 0,-1 15,-11" fill={topColor} fillOpacity="0.5" />
    {/* left face */}
    <polygon points="-15,-11 -15,4 0,14 0,-1" fill={leftColor} fillOpacity="0.5" />
    {/* right face */}
    <polygon points="15,-11 15,4 0,14 0,-1" fill={rightColor} fillOpacity="0.5" />
    <path
      d="M 0 -22 L -16 -12 L -16 5 L 0 15 L 16 5 L 16 -12 Z M -16 -12 L 0 -2 L 16 -12 M 0 -2 L 0 15"
      stroke={isHighlighted ? "#ec4899" : "#90ee90"}
      strokeWidth={isHighlighted ? 4 : 2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeOpacity={isHighlighted ? 1 : 0.7}
    />
  </g>
);

const EdgePieceSketch: React.FC<{ cx: number; cy: number; rotation: number; color: string; }> = ({ cx, cy, rotation, color }) => (
  <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`} opacity="0.6">
    <rect x="-15" y="-15" width="30" height="30" rx="3" fill="none" stroke={color} strokeWidth="2.5" />
    <path d="M0 -10 L0 10 M-6 4 L0 10 L6 4" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const GraphBackground: React.FC<{ cubeState: CubeState; showHighlightZones: boolean; showEdgeSketches: boolean; showCornerSketches: boolean; highlightedIds: Set<string> | null; }> = ({ cubeState, showHighlightZones, showEdgeSketches, showCornerSketches, highlightedIds }) => {
  const ufr_u = findStickerById('U_2_2', cubeState);
  const ufr_f = findStickerById('F_0_2', cubeState);
  const ufr_r = findStickerById('R_0_0', cubeState);

  const calculateEdgePositions = useCallback(() => {
    const sketchRadius = 185; // Adjusted for new radii

    const getMidpointAngle = (angle1: number, angle2: number) => {
        let mid = (angle1 + angle2) / 2;
        if (Math.abs(angle1 - angle2) > Math.PI) { // Handle wrap-around
            mid += Math.PI;
        }
        return (mid + 2 * Math.PI) % (2 * Math.PI);
    };

    const u_angles = GRAPH_STICKER_GROUP_ANGLES.U;
    const f_angles = GRAPH_STICKER_GROUP_ANGLES.F;
    const r_angles = GRAPH_STICKER_GROUP_ANGLES.R;

    const positions: { [key: string]: { cx: number; cy: number; rot: number; outerId: string; } } = {};
    
    // Pieces on U-circle's perimeter
    const ul_angle = getMidpointAngle(u_angles['L'], u_angles['F']);
    positions['UL'] = { ...polarToCartesian(GRAPH_CENTERS.U.x, GRAPH_CENTERS.U.y, sketchRadius, ul_angle), rot: ul_angle * 180 / Math.PI + 90, outerId: 'L_0_1' };
    const ub_angle = getMidpointAngle(u_angles['B'], u_angles['R']);
    positions['UB'] = { ...polarToCartesian(GRAPH_CENTERS.U.x, GRAPH_CENTERS.U.y, sketchRadius, ub_angle), rot: ub_angle * 180 / Math.PI + 90, outerId: 'B_0_1' };

    // Pieces on F-circle's perimeter
    const fl_angle = getMidpointAngle(f_angles['L'], f_angles['U']);
    positions['FL'] = { ...polarToCartesian(GRAPH_CENTERS.F.x, GRAPH_CENTERS.F.y, sketchRadius, fl_angle), rot: fl_angle * 180 / Math.PI + 90, outerId: 'L_1_2' };
    const fd_angle = getMidpointAngle(f_angles['D'], f_angles['R']);
    positions['FD'] = { ...polarToCartesian(GRAPH_CENTERS.F.x, GRAPH_CENTERS.F.y, sketchRadius, fd_angle), rot: fd_angle * 180 / Math.PI + 90, outerId: 'D_0_1' };
    
    // Pieces on R-circle's perimeter
    const rd_angle = getMidpointAngle(r_angles['D'], r_angles['F']);
    positions['RD'] = { ...polarToCartesian(GRAPH_CENTERS.R.x, GRAPH_CENTERS.R.y, sketchRadius, rd_angle), rot: rd_angle * 180 / Math.PI + 90, outerId: 'D_1_2' };
    const rb_angle = getMidpointAngle(r_angles['B'], r_angles['U']);
    positions['RB'] = { ...polarToCartesian(GRAPH_CENTERS.R.x, GRAPH_CENTERS.R.y, sketchRadius, rb_angle), rot: rb_angle * 180 / Math.PI + 90, outerId: 'B_1_0' };

    return positions;
  }, []);
  
  const edgePositions = calculateEdgePositions();
  
  const getFaceCenter = (startIdx: number) => {
    const nodes = GRAPH_NODES.slice(startIdx, startIdx + 9);
    if (nodes.length === 0) return GRAPH_CENTER;
    const center = nodes.reduce((acc, node) => ({x: acc.x + node.cx, y: acc.y + node.cy}), {x:0, y:0});
    center.x /= nodes.length;
    center.y /= nodes.length;
    return center;
  };
  
  const uFaceCenter = getFaceCenter(0);
  const fFaceCenter = getFaceCenter(18);
  const rFaceCenter = getFaceCenter(27);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {showHighlightZones && (
        <g opacity="0.8" style={{ pointerEvents: 'none' }}>
          {/* Yellow: Central Point (on central cube) */}
          <rect x={GRAPH_CENTER.x - 12.5} y={GRAPH_CENTER.y - 12.5} width="25" height="25" fill="none" stroke="yellow" strokeWidth="2.5" />
          
          {/* Cyan: Sticker Group (around R-face) */}
          <rect x={rFaceCenter.x - 32.5} y={rFaceCenter.y - 32.5} width="65" height="65" fill="none" stroke="cyan" strokeWidth="2.5" />
    
          {/* Symmetrically placed zone pairs */}
           {/* Blue outer corners */}
          {(() => {
            const zoneRadius = 160; // Adjusted for new radii
            const zoneSize = 25;
            const zoneColors = ['blue', 'blue', 'blue', ];
            const zoneAngles = [30, 150, 270];
            return zoneAngles.map((angle, i) => {
              const pos = polarToCartesian(GRAPH_CENTER.x, GRAPH_CENTER.y, zoneRadius, angle * Math.PI / 180);
              return (
                <rect key={i} x={pos.cx - zoneSize / 2} y={pos.cy - zoneSize / 2} width={zoneSize} height={zoneSize} fill="none" stroke={zoneColors[i]} strokeWidth="2.5" />
              );
            });
          })()}
           {/* Magenta inner corners */}
          {(() => {
            const zoneRadius = 102; // Adjusted for new radii
            const zoneSize = 25;
            const zoneColors = ['magenta', 'magenta', 'magenta'];
            const zoneAngles = [90, 210, 330];
            return zoneAngles.map((angle, i) => {
              const pos = polarToCartesian(GRAPH_CENTER.x, GRAPH_CENTER.y, zoneRadius, angle * Math.PI / 180);
              return (
                <rect key={i} x={pos.cx - zoneSize / 2} y={pos.cy - zoneSize / 2} width={zoneSize} height={zoneSize} fill="none" stroke={zoneColors[i]} strokeWidth="2.5" />
              );
            });
          })()}
        </g>
      )}
      {showCornerSketches && (<>
        {/* Central Corner Piece */}
        {ufr_u && ufr_f && ufr_r && (
          <CornerPieceSketch 
            cx={GRAPH_CENTER.x}
            cy={GRAPH_CENTER.y}
            rotation={0}
            topColor={SVG_COLORS[ufr_u.color]}
            leftColor={SVG_COLORS[ufr_f.color]}
            rightColor={SVG_COLORS[ufr_r.color]}
            isHighlighted={highlightedIds?.has('U_2_2')}
          />
        )}
        {/* Symmetrically Placed Outer Corner Pieces */}
        {(() => {
          const outerCornersData = [
            // Magenta Zone Corners (Inner Ring)
            { name: 'DFR', stickers: { d: 'D_0_2', f: 'F_2_2', r: 'R_2_0' }, angle: 90,  radius: 102, map: { top: 'd', left: 'f', right: 'r' }, rotation: 180 },
            { name: 'UFL', stickers: { u: 'U_2_0', f: 'F_0_0', l: 'L_0_2' }, angle: 210, radius: 102, map: { top: 'l', left: 'f', right: 'u' }, rotation: 300 },
            { name: 'UBR', stickers: { u: 'U_0_2', r: 'R_0_2', b: 'B_0_0' }, angle: 330, radius: 102, map: { top: 'b', left: 'u', right: 'r' }, rotation: 60 },
            // Blue Zone Corners (Outer Ring)
            { name: 'DFL', stickers: { d: 'D_0_0', f: 'F_2_0', l: 'L_2_2' }, angle: 150, radius: 160, map: { top: 'f', left: 'l', right: 'd' }, targetFaceCenter: fFaceCenter },
            { name: 'ULB', stickers: { u: 'U_0_0', l: 'L_0_0', b: 'B_0_2' }, angle: 270, radius: 160, map: { top: 'u', left: 'b', right: 'l' }, targetFaceCenter: uFaceCenter },
            { name: 'DBR', stickers: { d: 'D_2_2', b: 'B_2_0', r: 'R_2_2' }, angle: 30,  radius: 160, map: { top: 'r', left: 'd', right: 'b' }, targetFaceCenter: rFaceCenter },
          ];

          return outerCornersData.map(corner => {
            const stickerData: { [key: string]: Sticker | undefined } = {};
            let firstStickerId: string | null = null;
            Object.keys(corner.stickers).forEach(key => {
              const stickerId = corner.stickers[key as keyof typeof corner.stickers];
              if (!firstStickerId) firstStickerId = stickerId;
              stickerData[key] = findStickerById(stickerId, cubeState);
            });

            const topSticker = stickerData[corner.map.top];
            const leftSticker = stickerData[corner.map.left];
            const rightSticker = stickerData[corner.map.right];

            if (!topSticker || !leftSticker || !rightSticker) return null;

            const pos = polarToCartesian(GRAPH_CENTER.x, GRAPH_CENTER.y, corner.radius, corner.angle * Math.PI / 180);
            
            let rotation = corner.rotation;
            if (corner.targetFaceCenter) {
                const targetAngle = Math.atan2(corner.targetFaceCenter.y - pos.cy, corner.targetFaceCenter.x - pos.cx);
                rotation = targetAngle * 180 / Math.PI + 90; // +90 because sketch's 'top' is at -90deg
            }

            return (
              <CornerPieceSketch
                key={corner.name}
                cx={pos.cx}
                cy={pos.cy}
                rotation={rotation}
                topColor={SVG_COLORS[topSticker.color]}
                leftColor={SVG_COLORS[leftSticker.color]}
                rightColor={SVG_COLORS[rightSticker.color]}
                isHighlighted={!!firstStickerId && highlightedIds?.has(firstStickerId)}
              />
            );
          });
        })()}
      </>)}

      {showEdgeSketches && Object.keys(edgePositions).map((key) => {
        const pos = edgePositions[key];
        const sticker = findStickerById(pos.outerId, cubeState);
        return sticker ? (
          <EdgePieceSketch
            key={key}
            cx={pos.cx}
            cy={pos.cy}
            rotation={pos.rot}
            color={SVG_COLORS[sticker.color]}
          />
        ) : null;
      })}
    </g>
  );
};


export const Graph2D: React.FC<Graph2DProps> = ({ cubeState, highlightedIds, onStickerClick, showBld, onMove, playClickSound, showHighlightZones, showEdgeSketches, showNodeCoords, showCornerSketches, showCircleColors }) => {
  const allStickers = FACE_ORDER.flatMap(faceName => cubeState[faceName].flat());
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursorCoords, setCursorCoords] = useState<{ x: number, y: number } | null>(null);
  const [dragInfo, setDragInfo] = useState<{
    face: 'U' | 'F' | 'R';
    circle: GraphEdge;
    startAngleRad: number;
    currentAngleRad: number;
    totalRotationRad: number;
    stagedTurns: number;
  } | null>(null);
  const [fullTurnFlash, setFullTurnFlash] = useState(0);
  const lastTriggeredZoneIndexRef = useRef<number | null>(null);

  const getSVGCoordsFromEvent = useCallback((e: React.MouseEvent): { x: number, y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handleSVGMouseMove = (e: React.MouseEvent) => {
    if (showNodeCoords) {
      const coords = getSVGCoordsFromEvent(e);
      setCursorCoords(coords);
    }
  };

  const handleSVGMouseLeave = () => {
    setCursorCoords(null);
  };

  const getAngleFromEvent = useCallback((e: MouseEvent | React.MouseEvent, circle: GraphEdge): number => {
    const svg = svgRef.current;
    if (!svg) return 0;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    return Math.atan2(svgP.y - circle.cy, svgP.x - circle.cx);
  }, []);

  const handleDragStart = (e: React.MouseEvent, circle: GraphEdge) => {
    e.preventDefault();
    const angle = getAngleFromEvent(e, circle);
    
    const boundaries = GRAPH_STICKER_ZONE_BOUNDARIES[circle.face];
    const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
    let startingZoneIndex = -1;
     for (let i = 0; i < boundaries.length; i += 2) {
        let start = boundaries[i];
        let end = boundaries[i+1];
        if (start > end) { // Wraps around 2PI
            if (normalizedAngle >= start || normalizedAngle <= end) {
                startingZoneIndex = i / 2;
                break;
            }
        } else {
            if (normalizedAngle >= start && normalizedAngle <= end) {
                startingZoneIndex = i / 2;
                break;
            }
        }
    }
    
    lastTriggeredZoneIndexRef.current = startingZoneIndex;
    playClickSound(330, { duration: 0.08, volume: 0.2 }); // Low pitch: Drag mode enabled
    setDragInfo({
      face: circle.face,
      circle: circle,
      startAngleRad: angle,
      currentAngleRad: angle,
      totalRotationRad: 0,
      stagedTurns: 0,
    });
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragInfo) return;
    e.preventDefault();
    const angle = getAngleFromEvent(e, dragInfo.circle);
    
    let delta = angle - dragInfo.currentAngleRad;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta -= -2 * Math.PI;

    const prevTotalRotation = dragInfo.totalRotationRad;
    const newTotalRotation = prevTotalRotation + delta;
    
    const prevFullTurns = Math.floor(Math.abs(prevTotalRotation) / (2 * Math.PI));
    const currentFullTurns = Math.floor(Math.abs(newTotalRotation) / (2 * Math.PI));
    if (currentFullTurns > prevFullTurns) {
        setFullTurnFlash(c => c + 1);
    }
    
    const boundaries = GRAPH_STICKER_ZONE_BOUNDARIES[dragInfo.face];
    const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
    
    let currentZoneIndex = -1;
    for (let i = 0; i < boundaries.length; i += 2) {
        let start = boundaries[i];
        let end = boundaries[i+1];
        if (start > end) { // Wraps around 2PI
            if (normalizedAngle >= start || normalizedAngle <= end) {
                currentZoneIndex = i / 2;
                break;
            }
        } else {
            if (normalizedAngle >= start && normalizedAngle <= end) {
                currentZoneIndex = i / 2;
                break;
            }
        }
    }
    
    let newStagedTurns = dragInfo.stagedTurns;
    if (currentZoneIndex !== -1 && currentZoneIndex !== lastTriggeredZoneIndexRef.current) {
        const prevZone = lastTriggeredZoneIndexRef.current;
        if (prevZone !== null) {
            const clockwiseDist = (currentZoneIndex - prevZone + 4) % 4;
            const counterClockwiseDist = (prevZone - currentZoneIndex + 4) % 4;
            if(clockwiseDist < counterClockwiseDist){
                newStagedTurns += clockwiseDist;
            } else {
                newStagedTurns -= counterClockwiseDist;
            }
            playClickSound(550, { duration: 0.05, volume: 0.15 }); // Middle pitch: deciding turn amount
        }
        lastTriggeredZoneIndexRef.current = currentZoneIndex;
    }


    setDragInfo(prev => prev ? { 
        ...prev, 
        currentAngleRad: angle,
        totalRotationRad: newTotalRotation,
        stagedTurns: newStagedTurns,
    } : null);
  }, [dragInfo, getAngleFromEvent, playClickSound]);

  const handleDragEnd = useCallback(async () => {
    if (!dragInfo) return;

    const { stagedTurns, circle, face } = dragInfo;
    setDragInfo(null);

    const numTurns = stagedTurns;
    const effectiveTurns = (numTurns % 4 + 4) % 4;

    // The number of confirmation clicks should match the number of staged turns.
    const clicksToPlay = Math.abs(numTurns);

    if (clicksToPlay > 0) {
      for (let i = 0; i < clicksToPlay; i++) {
        playClickSound(1320); // Higher pitch for confirmation
        if (i < clicksToPlay - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    } else if (dragInfo.totalRotationRad !== 0) { // Small drag, no turns
        // no sound
    }


    if (effectiveTurns === 0) return;

    let clockwiseMove: Move;

    const radius = circle.r;
    if (radius === GRAPH_RADII[1]) { // Middle circle -> Slice move
        switch (face) {
            case 'U': clockwiseMove = "E'"; break;
            case 'F': clockwiseMove = 'S'; break;
            case 'R': clockwiseMove = "M'"; break;
            default: return;
        }
    } else { // Inner or Outer circle -> Face move
        const isOuterCircle = radius === GRAPH_RADII[2];
        switch (face) {
            case 'U': clockwiseMove = isOuterCircle ? "D'" : "U"; break;
            case 'F': clockwiseMove = isOuterCircle ? "B'" : "F"; break;
            case 'R': clockwiseMove = isOuterCircle ? "L'" : "R"; break;
            default: return;
        }
    }

    // Execute the move `effectiveTurns` times to get the correct animation sequence.
    for (let i = 0; i < effectiveTurns; i++) {
        onMove(clockwiseMove, { playSound: false });
        if (i < effectiveTurns - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }
  }, [dragInfo, onMove, playClickSound]);
  
  useEffect(() => {
    if (dragInfo) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd, { once: true });
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragInfo, handleDragMove, handleDragEnd]);
  
  const renderDragArc = () => {
    if (!dragInfo || dragInfo.totalRotationRad === 0) return null;
    const { circle, startAngleRad, totalRotationRad } = dragInfo;
    
    const currentAngle = startAngleRad + totalRotationRad;
    const start = polarToCartesian(circle.cx, circle.cy, circle.r, startAngleRad);
    const end = polarToCartesian(circle.cx, circle.cy, circle.r, currentAngle);
    
    const largeArcFlag = Math.abs(totalRotationRad % (2 * Math.PI)) > Math.PI ? '1' : '0';
    const sweepFlag = totalRotationRad > 0 ? '1' : '0';

    // FIX: Changed properties from .x, .y to .cx, .cy to match object returned by polarToCartesian.
    const pathData = `M ${start.cx} ${start.cy} A ${circle.r} ${circle.r} 0 ${largeArcFlag} ${sweepFlag} ${end.cx} ${end.cy}`;

    return (
        <path
            d={pathData}
            fill="none"
            stroke="#ec4899"
            strokeOpacity="0.8"
            strokeWidth="5"
            strokeLinecap="round"
            style={{pointerEvents: 'none'}}
        />
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        ref={svgRef}
        viewBox="-50 -50 500 500"
        className={`max-w-full max-h-full ${dragInfo ? 'cursor-grabbing' : ''}`}
        onMouseMove={handleSVGMouseMove}
        onMouseLeave={handleSVGMouseLeave}
      >
        <GraphBackground cubeState={cubeState} showHighlightZones={showHighlightZones} showEdgeSketches={showEdgeSketches} showCornerSketches={showCornerSketches} highlightedIds={highlightedIds} />
        <g>
          {GRAPH_CIRCLES.map((circle, i) => {
            const oppositeFaceMap: Record<'U' | 'F' | 'R', 'D' | 'B' | 'L'> = { U: 'D', F: 'B', R: 'L' };
            let color: string;

            if (circle.r === GRAPH_RADII[2]) { // Outer circle
                const oppositeFaceName = oppositeFaceMap[circle.face];
                const oppositeCenterSticker = cubeState[oppositeFaceName][1][1];
                color = SVG_COLORS[oppositeCenterSticker.color];
            } else if (circle.r === GRAPH_RADII[1]) { // Middle circle
                color = '#9ca3af'; // Tailwind gray-400
            } else { // Inner circle (r === GRAPH_RADII[0])
                 const centerSticker = cubeState[circle.face][1][1];
                 color = SVG_COLORS[centerSticker.color];
            }
            
            const finalColor = showCircleColors ? color : '#9ca3af';
            const isFlashing = fullTurnFlash > 0 && dragInfo?.circle.face === circle.face;

            return (
              <g key={i}>
                <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  stroke={finalColor}
                  strokeWidth="2"
                  strokeOpacity={dragInfo && dragInfo.circle.face !== circle.face ? 0.2 : 0.6}
                  fill="none"
                  className={isFlashing ? 'full-turn-flash' : ''}
                  onAnimationEnd={() => setFullTurnFlash(c => c - 1)}
                />
                 <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  stroke="transparent"
                  strokeWidth="12"
                  fill="none"
                  className="cursor-grab"
                  onMouseDown={(e) => handleDragStart(e, circle)}
                />
              </g>
            );
          })}
        </g>
        <g>
          {GRAPH_NODES.map(node => {
            const stickerIndex = STICKER_TO_NODE_MAP[node.id];
            if (stickerIndex === undefined) return null;
            const sticker = allStickers[stickerIndex];
            if (!sticker) return null;

            const isHighlighted = highlightedIds?.has(sticker.id);
            const bldLetter = BLD_ALPHABET[sticker.id];

            return (
              <g key={node.id} onClick={() => onStickerClick(sticker.id)} className="cursor-pointer">
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={8}
                  fill={SVG_COLORS[sticker.color]}
                  stroke={isHighlighted ? '#ec4899' : '#111827'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                />
                 <g transform={`translate(${node.cx}, ${node.cy}) rotate(${sticker.rotation})`}>
                    {!showBld && <path d="M0 -4 L4 1 H2.5 L2.5 4 H-2.5 L-2.5 1 H-4 Z" fill="rgba(0,0,0,0.4)" />}
                 </g>
                 {showBld && bldLetter && (
                    <text x={node.cx} y={node.cy + 4.5} textAnchor="middle" fill="rgba(0,0,0,0.6)" fontSize="12" fontWeight="bold" style={{pointerEvents: 'none', userSelect: 'none'}}>
                        {bldLetter}
                    </text>
                 )}
              </g>
            );
          })}
        </g>
        {renderDragArc()}
        {showNodeCoords && cursorCoords && !dragInfo && (
            <text
                x={cursorCoords.x + 10}
                y={cursorCoords.y + 10}
                fill="white"
                fontSize="10"
                fontFamily="monospace"
                className="pointer-events-none select-none"
            >
                {`${Math.round(cursorCoords.x - GRAPH_CENTER.x)},${Math.round(cursorCoords.y - GRAPH_CENTER.y)}`}
            </text>
        )}
      </svg>
    </div>
  );
};