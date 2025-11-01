import React from 'react';
import type { Move } from '../types';

interface ControlsProps {
  onMove: (move: Move) => void;
  onShuffle: () => void;
  onReset: () => void;
  isAnimating: boolean;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean; }> = ({ onClick, children, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 bg-gray-700/80 text-white rounded-md hover:bg-gray-600/80 transition-colors duration-200 backdrop-blur-sm text-sm font-mono w-10 text-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

export const Controls: React.FC<ControlsProps> = ({ onMove, onShuffle, onReset, isAnimating }) => {
  const axes = [
    { cube: ["z'", 'z'], left: ["D'", 'D'], middle: ["E'", 'E'], right: ["U'", 'U'] },
    { cube: ["x'", 'x'], left: ["B'", 'B'], middle: ["S'", 'S'], right: ["F'", 'F'] },
    { cube: ["y'", 'y'], left: ["L'", 'L'], middle: ["M'", 'M'], right: ["R'", 'R'] },
  ];

  return (
    <div className="p-4 rounded-lg bg-gray-900/50 flex flex-col gap-4">
        {/* Clockwise Moves */}
        <div className="flex flex-col gap-3">
            {axes.map((axis, index) => (
                <div key={`cw-${index}`} className="flex items-center justify-center gap-3 sm:gap-4">
                    <ControlButton onClick={() => onMove(axis.cube[1] as Move)} disabled={isAnimating}>{axis.cube[1]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.left[1] as Move)} disabled={isAnimating}>{axis.left[1]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.middle[1] as Move)} disabled={isAnimating}>{axis.middle[1]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.right[1] as Move)} disabled={isAnimating}>{axis.right[1]}</ControlButton>
                </div>
            ))}
        </div>
        
        <div className="border-t border-gray-700/50"></div>

        {/* Counter-Clockwise Moves */}
        <div className="flex flex-col gap-3">
            {axes.map((axis, index) => (
                <div key={`ccw-${index}`} className="flex items-center justify-center gap-3 sm:gap-4">
                    <ControlButton onClick={() => onMove(axis.cube[0] as Move)} disabled={isAnimating}>{axis.cube[0]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.left[0] as Move)} disabled={isAnimating}>{axis.left[0]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.middle[0] as Move)} disabled={isAnimating}>{axis.middle[0]}</ControlButton>
                    <ControlButton onClick={() => onMove(axis.right[0] as Move)} disabled={isAnimating}>{axis.right[0]}</ControlButton>
                </div>
            ))}
        </div>

        <div className="border-t border-gray-700/50 my-2"></div>

        <div className="flex gap-2">
            <ControlButton onClick={onShuffle} className="flex-1 !w-full bg-indigo-600/80 hover:bg-indigo-500/80" disabled={isAnimating}>Shuffle</ControlButton>
            <ControlButton onClick={onReset} className="flex-1 !w-full bg-rose-600/80 hover:bg-rose-500/80" disabled={isAnimating}>Reset</ControlButton>
        </div>
    </div>
  );
};