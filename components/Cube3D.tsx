import React, { useState, useRef, useEffect } from 'react';
import type { CubeState, FaceName, Sticker, Move } from '../types';
import { COLORS, BLD_ALPHABET } from '../constants';

const ArrowIcon = () => (
  <svg viewBox="0 0 10 10" className="w-2/3 h-2/3 text-black/50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0 L10 5 H7 L7 10 H3 L3 5 H0 Z" />
  </svg>
);

const faceTransforms: Record<FaceName, string> = {
  F: 'rotateY(0deg) translateZ(1.5em)',
  B: 'rotateY(180deg) translateZ(1.5em)',
  R: 'rotateY(90deg) translateZ(1.5em)',
  L: 'rotateY(-90deg) translateZ(1.5em)',
  U: 'rotateX(90deg) translateZ(1.5em)',
  D: 'rotateX(-90deg) translateZ(1.5em)',
};

const AnimationHighlight: React.FC<{face: FaceName, clockwise: boolean}> = ({ face, clockwise }) => {
    return (
        <div className="absolute w-[3em] h-[3em] [transform-style:preserve-3d]" style={{ transform: faceTransforms[face] }}>
            <div className={`absolute inset-[-2px] border-2 border-pink-500 rounded-sm animate-ping opacity-75`} style={{ animationDuration: '0.3s' }} />
        </div>
    );
};

interface FaceProps {
    stickers: Sticker[][];
    face: FaceName;
    highlightedIds: Set<string> | null;
    onStickerClick: (stickerId: string) => void;
    showBld: boolean;
    onStickerDragStart: (e: React.MouseEvent, stickerId: string) => void;
}

const Face: React.FC<FaceProps> = ({ stickers, face, highlightedIds, onStickerClick, showBld, onStickerDragStart }) => {
  return (
    <div
      className={`absolute w-[3em] h-[3em] grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-black/70`}
      style={{ transform: faceTransforms[face] }}
    >
      {stickers.flat().map((sticker) => {
        const isHighlighted = highlightedIds?.has(sticker.id);
        const bldLetter = BLD_ALPHABET[sticker.id];
        return (
            <div 
              key={sticker.id} 
              className={`relative w-full h-full ${COLORS[sticker.color]} flex items-center justify-center cursor-pointer`}
              onClick={() => onStickerClick(sticker.id)}
              onMouseDown={(e) => onStickerDragStart(e, sticker.id)}
            >
                <div className={`transition-transform duration-200 ${showBld && bldLetter ? 'opacity-0' : 'opacity-100'}`} style={{transform: `rotate(${sticker.rotation}deg)`}}>
                    <ArrowIcon />
                </div>
                {showBld && bldLetter && (
                    <span className="absolute font-bold text-black/60 text-base select-none">{bldLetter}</span>
                )}
                {isHighlighted && <div className="absolute inset-0 ring-2 ring-pink-500 ring-inset" />}
            </div>
        );
      })}
    </div>
  );
};

// This function maps a 2D drag direction on a specific sticker to a 3D cube move.
// It considers the face, row, and column to provide an intuitive mapping.
const mapDragToMove = (stickerId: string, isHorizontal: boolean, isPositive: boolean): Move | null => {
    const [face, rowStr, colStr] = stickerId.split('_');
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);

    if (isHorizontal) { // Horizontal Drag (right is positive)
        switch (face) {
            case 'F': 
                if (row === 0) return isPositive ? "U'" : "U";
                if (row === 1) return isPositive ? "E'" : "E";
                if (row === 2) return isPositive ? "D" : "D'";
                break;
            case 'B':
                if (row === 0) return isPositive ? "U" : "U'";
                if (row === 1) return isPositive ? "E" : "E'";
                if (row === 2) return isPositive ? "D'" : "D";
                break;
            case 'U':
                if (row === 0) return isPositive ? "B'" : "B";
                if (row === 1) return isPositive ? "S'" : "S";
                if (row === 2) return isPositive ? "F" : "F'";
                break;
            case 'D':
                if (row === 0) return isPositive ? "F" : "F'";
                if (row === 1) return isPositive ? "S'" : "S";
                if (row === 2) return isPositive ? "B'" : "B";
                break;
            case 'R':
                if (row === 0) return isPositive ? "U'" : "U";
                if (row === 1) return isPositive ? "E'" : "E";
                if (row === 2) return isPositive ? "D" : "D'";
                break;
            case 'L':
                if (row === 0) return isPositive ? "U" : "U'";
                if (row === 1) return isPositive ? "E" : "E'";
                if (row === 2) return isPositive ? "D'" : "D";
                break;
        }
    } else { // Vertical Drag (up is positive)
        switch (face) {
            case 'F':
                if (col === 0) return isPositive ? "L" : "L'";
                if (col === 1) return isPositive ? "M'" : "M";
                if (col === 2) return isPositive ? "R" : "R'";
                break;
            case 'B':
                if (col === 0) return isPositive ? "R'" : "R";
                if (col === 1) return isPositive ? "M" : "M'";
                if (col === 2) return isPositive ? "L'" : "L";
                break;
            case 'U':
                if (col === 0) return isPositive ? "L'" : "L";
                if (col === 1) return isPositive ? "M" : "M'";
                if (col === 2) return isPositive ? "R" : "R'";
                break;
            case 'D':
                if (col === 0) return isPositive ? "L'" : "L";
                if (col === 1) return isPositive ? "M" : "M'";
                if (col === 2) return isPositive ? "R" : "R'";
                break;
            case 'R':
                if (col === 0) return isPositive ? "F'" : "F";
                if (col === 1) return isPositive ? "S" : "S'";
                if (col === 2) return isPositive ? "B" : "B'";
                break;
            case 'L':
                if (col === 0) return isPositive ? "B'" : "B";
                if (col === 1) return isPositive ? "S'" : "S";
                if (col === 2) return isPositive ? "F" : "F'";
                break;
        }
    }
    return null;
}

export const Cube3D: React.FC<{ 
  cubeState: CubeState; 
  highlightedIds: Set<string> | null; 
  onStickerClick: (stickerId: string) => void;
  showBld: boolean;
  onMove: (move: Move) => void;
  animatedFace: { face: FaceName, clockwise: boolean } | null;
}> = ({ cubeState, highlightedIds, onStickerClick, showBld, onMove, animatedFace }) => {
  const [rotation, setRotation] = useState({ x: -30, y: -45 });
  const [isCameraDragging, setIsCameraDragging] = useState(false);
  const [isStickerDragging, setIsStickerDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStickerId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragVector, setDragVector] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

  const handleCameraMouseDown = (e: React.MouseEvent) => {
    // Only start camera drag if not interacting with a sticker
    if (e.target === e.currentTarget || (e.target as HTMLElement).parentElement === e.currentTarget) {
        setIsCameraDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleStickerDragStart = (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    setIsStickerDragging(true);
    dragStickerId.current = stickerId;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const startPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setDragVector({ start: startPos, end: startPos });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isCameraDragging) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      setRotation(prev => ({
        x: prev.x - deltaY * 0.5,
        y: prev.y + deltaX * 0.5,
      }));
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    } else if (isStickerDragging) {
       const rect = containerRef.current?.getBoundingClientRect();
       if (rect) {
        const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setDragVector(prev => prev ? { ...prev, end: currentPos } : null);
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isStickerDragging && dragVector && dragStickerId.current) {
        const deltaX = dragVector.end.x - dragVector.start.x;
        const deltaY = dragVector.end.y - dragVector.start.y;
        const dragDistance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        
        if (dragDistance > 40) { // Drag threshold increased from 20 to 40
            const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
            const isPositive = isHorizontal ? deltaX > 0 : deltaY < 0; // Invert Y-axis for intuitive up/down
            const move = mapDragToMove(dragStickerId.current, isHorizontal, isPositive);
            if (move) {
                onMove(move);
            }
        }
    }
    setIsCameraDragging(false);
    setIsStickerDragging(false);
    dragStickerId.current = null;
    setDragVector(null);
  };
  
  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-4xl overflow-hidden"
        onMouseDown={handleCameraMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <div className="[perspective:1000px]">
        <div
          className="relative w-[3em] h-[3em] [transform-style:preserve-3d] transition-transform duration-75"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
            {(Object.keys(cubeState) as FaceName[]).map(faceName => (
                <Face 
                  key={faceName} 
                  face={faceName} 
                  stickers={cubeState[faceName]} 
                  highlightedIds={highlightedIds} 
                  onStickerClick={onStickerClick} 
                  showBld={showBld} 
                  onStickerDragStart={handleStickerDragStart}
                />
            ))}
            {animatedFace && <AnimationHighlight face={animatedFace.face} clockwise={animatedFace.clockwise} />}
        </div>
      </div>
       {dragVector && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
            </marker>
          </defs>
          <line
            x1={dragVector.start.x}
            y1={dragVector.start.y}
            x2={dragVector.end.x}
            y2={dragVector.end.y}
            stroke="#ec4899"
            strokeWidth="3"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
        </svg>
      )}
    </div>
  );
};