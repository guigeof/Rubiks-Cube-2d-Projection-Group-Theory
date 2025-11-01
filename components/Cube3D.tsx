import React, { useState, useRef, useEffect } from 'react';
import type { CubeState, FaceName, Sticker } from '../types';
import { COLORS } from '../constants';

const ArrowIcon = () => (
  <svg viewBox="0 0 10 10" className="w-2/3 h-2/3 text-black/50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0 L10 5 H7 L7 10 H3 L3 5 H0 Z" />
  </svg>
);

interface FaceProps {
    stickers: Sticker[][];
    face: FaceName;
}

const Face: React.FC<FaceProps> = ({ stickers, face }) => {
  const faceTransforms: Record<FaceName, string> = {
    F: 'rotateY(0deg) translateZ(1.5em)',
    B: 'rotateY(180deg) translateZ(1.5em)',
    R: 'rotateY(90deg) translateZ(1.5em)',
    L: 'rotateY(-90deg) translateZ(1.5em)',
    U: 'rotateX(90deg) translateZ(1.5em)',
    D: 'rotateX(-90deg) translateZ(1.5em)',
  };

  return (
    <div
      className={`absolute w-[3em] h-[3em] grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-black/70`}
      style={{ transform: faceTransforms[face] }}
    >
      {stickers.flat().map((sticker, i) => (
        <div key={i} className={`w-full h-full ${COLORS[sticker.color]} flex items-center justify-center`}>
            <div className="transition-transform duration-200" style={{transform: `rotate(${sticker.rotation}deg)`}}>
                <ArrowIcon />
            </div>
        </div>
      ))}
    </div>
  );
};

export const Cube3D: React.FC<{ cubeState: CubeState }> = ({ cubeState }) => {
  const [rotation, setRotation] = useState({ x: -30, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cubeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;

    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    const handleMouseUpWindow = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpWindow);
    return () => window.removeEventListener('mouseup', handleMouseUpWindow);
  }, []);


  return (
    <div 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-4xl"
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <div className="[perspective:1000px]">
        <div
          ref={cubeRef}
          className="relative w-[3em] h-[3em] [transform-style:preserve-3d] transition-transform duration-75"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
            <Face face="F" stickers={cubeState.F} />
            <Face face="B" stickers={cubeState.B} />
            <Face face="R" stickers={cubeState.R} />
            <Face face="L" stickers={cubeState.L} />
            <Face face="U" stickers={cubeState.U} />
            <Face face="D" stickers={cubeState.D} />
        </div>
      </div>
    </div>
  );
};
