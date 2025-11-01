import React from 'react';
import type { CubeState, FaceName, Sticker } from '../types';
import { GRAPH_NODES, GRAPH_CIRCLES, STICKER_TO_NODE_MAP, SVG_COLORS } from '../constants';

interface Graph2DProps {
  cubeState: CubeState;
}

const FACE_ORDER: FaceName[] = ['U', 'L', 'F', 'R', 'B', 'D'];

export const Graph2D: React.FC<Graph2DProps> = ({ cubeState }) => {
  const allStickers = FACE_ORDER.flatMap(faceName => cubeState[faceName].flat());

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg viewBox="0 0 400 400" className="max-w-full max-h-full">
        <g>
          {GRAPH_CIRCLES.map((circle, i) => (
            <circle
              key={`circle-${i}`}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              stroke="rgba(156, 163, 175, 0.5)"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </g>
        <g>
          {GRAPH_NODES.map((node) => {
            if (!node) return null;
            const stickerIndex = STICKER_TO_NODE_MAP[node.id];
            const sticker = allStickers[stickerIndex];
            if (!sticker) return null;
            return (
              <g key={`node-group-${node.id}`}>
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="8"
                  fill={SVG_COLORS[sticker.color]}
                  stroke="#111827"
                  strokeWidth="1.5"
                />
                <path 
                    d="M -3 -1 L 0 -4 L 3 -1 L 1 0 L 1 4 L -1 4 L -1 0 Z"
                    fill="rgba(0,0,0,0.5)"
                    transform={`translate(${node.cx}, ${node.cy}) rotate(${sticker.rotation})`}
                    style={{ transition: 'transform 0.2s' }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
