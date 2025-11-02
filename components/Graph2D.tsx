import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { CubeState, FaceName, Sticker, Move, GraphEdge } from '../types';
import { GRAPH_NODES, GRAPH_CIRCLES, STICKER_TO_NODE_MAP, SVG_COLORS, BLD_ALPHABET, GRAPH_STICKER_GROUP_ANGLES, GRAPH_STICKER_ZONE_BOUNDARIES } from '../constants';

interface Graph2DProps {
  cubeState: CubeState;
  highlightedIds: Set<string> | null;
  onStickerClick: (stickerId: string) => void;
  showBld: boolean;
  onMove: (move: Move, options?: { playSound?: boolean }) => void;
  playClickSound: (pitch?: number, options?: { duration?: number, volume?: number }) => void;
}

const FACE_ORDER: FaceName[] = ['U', 'L', 'F', 'R', 'B', 'D'];

// Helper to convert polar coords (angle in rad) to cartesian for SVG paths
const polarToCartesian = (cx: number, cy: number, r: number, angleRad: number) => {
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
    };
};

export const Graph2D: React.FC<Graph2DProps> = ({ cubeState, highlightedIds, onStickerClick, showBld, onMove, playClickSound }) => {
  const allStickers = FACE_ORDER.flatMap(faceName => cubeState[faceName].flat());
  const svgRef = useRef<SVGSVGElement>(null);
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
    if (delta < -Math.PI) delta -= 2 * Math.PI;

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
    if (radius === 120) { // Middle circle -> Slice move
        switch (face) {
            case 'U': clockwiseMove = "E'"; break;
            case 'F': clockwiseMove = 'S'; break;
            case 'R': clockwiseMove = "M'"; break;
            default: return;
        }
    } else { // Inner or Outer circle -> Face move
        const isOuterCircle = radius === 140;
        switch (face) {
            case 'U': clockwiseMove = isOuterCircle ? "D'" : "U"; break;
            case 'F': clockwiseMove = isOuterCircle ? "B'" : "F"; break;
            case 'R': clockwiseMove = isOuterCircle ? "L'" : "L"; break;
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

    const pathData = `M ${start.x} ${start.y} A ${circle.r} ${circle.r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;

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
      <svg ref={svgRef} viewBox="0 0 400 400" className={`max-w-full max-h-full ${dragInfo ? 'cursor-grabbing' : ''}`}>
        <g>
          {GRAPH_CIRCLES.map((circle, i) => {
            const oppositeFaceMap: Record<'U' | 'F' | 'R', 'D' | 'B' | 'L'> = { U: 'D', F: 'B', R: 'L' };
            const isOuterCircle = circle.r === 140;
            let color: string;

            if (isOuterCircle) {
                const oppositeFaceName = oppositeFaceMap[circle.face];
                const oppositeCenterSticker = cubeState[oppositeFaceName][1][1];
                color = SVG_COLORS[oppositeCenterSticker.color];
            } else {
                 const centerSticker = cubeState[circle.face][1][1];
                 color = SVG_COLORS[centerSticker.color];
            }
            
            const isFlashing = fullTurnFlash > 0 && dragInfo?.circle.face === circle.face;

            return (
              <g key={i}>
                <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  stroke={color}
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
      </svg>
    </div>
  );
};