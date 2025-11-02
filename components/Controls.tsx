import React, { useRef, useEffect } from 'react';
import type { Move } from '../types';

interface ControlsProps {
  onMove: (move: Move) => void;
  onShuffle: () => void;
  onReset: () => void;
  onPrevPiece: () => void;
  onNextPiece: () => void;
  onClearHighlight: () => void;
  isAnimating: boolean;
}

const useDoubleClick = (onClick: () => void, onDoubleClick: () => void, delay: number = 250) => {
    const clickTimeout = useRef<number | null>(null);

    const clearClickTimeout = () => {
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
        }
    };

    const handler = () => {
        if (clickTimeout.current) {
            clearClickTimeout();
            onDoubleClick();
        } else {
            clickTimeout.current = window.setTimeout(() => {
                onClick();
                clickTimeout.current = null;
            }, delay);
        }
    };
    
    useEffect(() => {
        return () => clearClickTimeout();
    }, []);

    return handler;
};


const ControlButton: React.FC<{
  move: Move;
  onMove: (move: Move) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ move, onMove, children, className = '', disabled = false }) => {
  const isPrime = move.includes("'");
  const baseMove = move.replace("'", "") as Move;

  const handleSingleClick = () => onMove(move);
  const handleDoubleClick = () => onMove(`${baseMove}2` as Move);

  const clickHandler = useDoubleClick(handleSingleClick, handleDoubleClick);

  return (
    <button
      onClick={isPrime ? handleSingleClick : clickHandler}
      disabled={disabled}
      title={isPrime ? `Move ${move}` : `Click for ${move}, Double-click for ${move}2`}
      className={`px-3 py-1.5 bg-gray-700/80 text-white rounded-md hover:bg-gray-600/80 transition-colors duration-200 backdrop-blur-sm text-sm font-mono text-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const SimpleButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean; }> = ({ onClick, children, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 bg-gray-700/80 text-white rounded-md hover:bg-gray-600/80 transition-colors duration-200 backdrop-blur-sm text-sm font-mono text-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);


export const Controls: React.FC<ControlsProps> = ({ 
    onMove, onShuffle, onReset, 
    onPrevPiece, onNextPiece, onClearHighlight, 
    isAnimating 
}) => {
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
                <div key={`cw-${index}`} className="flex items-center justify-center gap-2 sm:gap-3">
                    <ControlButton onMove={onMove} move={axis.cube[1] as Move} disabled={isAnimating} className="w-10">{axis.cube[1]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.left[1] as Move} disabled={isAnimating} className="w-10">{axis.left[1]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.middle[1] as Move} disabled={isAnimating} className="w-10">{axis.middle[1]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.right[1] as Move} disabled={isAnimating} className="w-10">{axis.right[1]}</ControlButton>
                </div>
            ))}
        </div>
        
        <div className="border-t border-gray-700/50"></div>

        {/* Counter-Clockwise Moves */}
        <div className="flex flex-col gap-3">
            {axes.map((axis, index) => (
                <div key={`ccw-${index}`} className="flex items-center justify-center gap-2 sm:gap-3">
                    <ControlButton onMove={onMove} move={axis.cube[0] as Move} disabled={isAnimating} className="w-10">{axis.cube[0]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.left[0] as Move} disabled={isAnimating} className="w-10">{axis.left[0]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.middle[0] as Move} disabled={isAnimating} className="w-10">{axis.middle[0]}</ControlButton>
                    <ControlButton onMove={onMove} move={axis.right[0] as Move} disabled={isAnimating} className="w-10">{axis.right[0]}</ControlButton>
                </div>
            ))}
        </div>

        <div className="border-t border-gray-700/50 my-1"></div>
        
        {/* Piece Identification Controls */}
        <div className="flex gap-2 text-xs">
            <SimpleButton onClick={onPrevPiece} className="flex-1 !w-full" disabled={isAnimating}>Prev Piece</SimpleButton>
            <SimpleButton onClick={onNextPiece} className="flex-1 !w-full" disabled={isAnimating}>Next Piece</SimpleButton>
            <SimpleButton onClick={onClearHighlight} className="flex-1 !w-full" disabled={isAnimating}>Clear</SimpleButton>
        </div>

        <div className="border-t border-gray-700/50 my-1"></div>

        <div className="flex gap-2">
            <SimpleButton onClick={onShuffle} className="flex-1 !w-full bg-indigo-600/80 hover:bg-indigo-500/80" disabled={isAnimating}>Shuffle</SimpleButton>
            <SimpleButton onClick={onReset} className="flex-1 !w-full bg-rose-600/80 hover:bg-rose-500/80" disabled={isAnimating}>Reset</SimpleButton>
        </div>
    </div>
  );
};