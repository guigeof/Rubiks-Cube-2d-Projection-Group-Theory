import React, { useState, useCallback, useEffect } from 'react';
import { Cube3D } from './components/Cube3D';
import { Graph2D } from './components/Graph2D';
import { Controls } from './components/Controls';
import { INITIAL_CUBE_STATE, COLORS } from './constants';
import { applyMove } from './services/cubeLogic';
import type { CubeState, Move, FaceState, FaceName } from './types';

const ArrowIcon = () => (
  <svg viewBox="0 0 10 10" className="w-1/2 h-1/2 text-black/40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0 L10 5 H7 L7 10 H3 L3 5 H0 Z" />
  </svg>
);

interface FaceDisplayProps {
  faceState: FaceState;
  faceName: FaceName;
  withCircles?: boolean;
}

const FaceDisplay: React.FC<FaceDisplayProps> = ({ faceState, faceName, withCircles = false }) => {
  return (
    <div className="relative w-24 h-24">
      <div className="grid grid-cols-3 grid-rows-3 gap-px bg-black w-full h-full p-0.5 rounded-sm">
        {faceState.flat().map((sticker, i) => (
          <div key={`${faceName}-${i}`} className={`w-full h-full ${COLORS[sticker.color]} rounded-sm flex items-center justify-center`}>
             <div className="transition-transform duration-200" style={{transform: `rotate(${sticker.rotation}deg)`}}>
                <ArrowIcon />
            </div>
          </div>
        ))}
      </div>
      {withCircles && (
        <svg viewBox="0 0 96 96" className="absolute top-0 left-0 w-full h-full">
            <circle cx="48" cy="48" r="28" stroke="rgba(200, 200, 200, 0.4)" strokeWidth="1.5" fill="none" />
            <circle cx="48" cy="48" r="36" stroke="rgba(200, 200, 200, 0.4)" strokeWidth="1.5" fill="none" />
            <circle cx="48" cy="48" r="44" stroke="rgba(200, 200, 200, 0.4)" strokeWidth="1.5" fill="none" />
        </svg>
      )}
    </div>
  );
};

const CrossProjection: React.FC<{ cubeState: CubeState }> = ({ cubeState }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
        <div className="grid grid-cols-4 grid-rows-3 gap-1 place-items-center">
            <div className="col-start-2"><FaceDisplay faceState={cubeState.U} faceName="U" withCircles /></div>
            <div className="col-start-1 row-start-2"><FaceDisplay faceState={cubeState.L} faceName="L" /></div>
            <div className="col-start-2 row-start-2"><FaceDisplay faceState={cubeState.F} faceName="F" /></div>
            <div className="col-start-3 row-start-2"><FaceDisplay faceState={cubeState.R} faceName="R" /></div>
            <div className="col-start-4 row-start-2"><FaceDisplay faceState={cubeState.B} faceName="B" /></div>
            <div className="col-start-2 row-start-3"><FaceDisplay faceState={cubeState.D} faceName="D" /></div>
        </div>
    </div>
  );
};

type ProjectionType = 'cross' | 'graph';

const parseFormula = (formula: string): Move[] => {
    const validMoves: Move[] = [
      'U', "U'", 'D', "D'", 'L', "L'", 'R', "R'", 'F', "F'", 'B', "B'",
      'M', "M'", 'E', "E'", 'S', "S'", 'x', "x'", 'y', "y'", 'z', "z'"
    ];
    const moveSet = new Set(validMoves);
    const tokens = formula.trim().split(/\s+/);
    const parsedMoves: Move[] = [];

    for (const token of tokens) {
      if (!token) continue;
      
      if (token.length === 2 && token.endsWith('2')) {
        const baseMove = token.slice(0, 1).toUpperCase() as Move;
        if (moveSet.has(baseMove)) {
          parsedMoves.push(baseMove, baseMove);
        }
      } else if (moveSet.has(token as Move)) {
        parsedMoves.push(token as Move);
      }
    }
    return parsedMoves;
};


const App: React.FC = () => {
  const [cubeState, setCubeState] = useState<CubeState>(INITIAL_CUBE_STATE);
  const [projectionType, setProjectionType] = useState<ProjectionType>('cross');
  const [formula, setFormula] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMove = useCallback((move: Move) => {
    setCubeState(prevState => applyMove(prevState, move));
  }, []);
  
  const handleReset = useCallback(() => {
    if (isAnimating) return;
    setCubeState(INITIAL_CUBE_STATE);
  }, [isAnimating]);

  const handleShuffle = useCallback(() => {
    if (isAnimating) return;
    let state = INITIAL_CUBE_STATE;
    const moves: Move[] = [
      'U', "U'", 'D', "D'", 'L', "L'", 
      'R', "R'", 'F', "F'", 'B', "B'",
      'M', "M'", 'E', "E'", 'S', "S'",
    ];
    for (let i = 0; i < 25; i++) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      state = applyMove(state, randomMove);
    }
    setCubeState(state);
  }, [isAnimating]);

  const handleRunFormula = useCallback(() => {
    const moves = parseFormula(formula);
    if (moves.length === 0) return;

    setIsAnimating(true);
    let moveIndex = 0;

    const intervalId = setInterval(() => {
      if (moveIndex >= moves.length) {
        clearInterval(intervalId);
        setIsAnimating(false);
        return;
      }
      handleMove(moves[moveIndex]);
      moveIndex++;
    }, 250);
  }, [formula, handleMove]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAnimating || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toUpperCase();
      const isShiftPressed = event.shiftKey;

      const keyToMoveMap: { [key: string]: Move } = {
        'U': 'U', 'D': 'D', 'L': 'L', 'R': 'R', 'F': 'F', 'B': 'B',
        'M': 'M', 'E': 'E', 'S': 'S',
        'X': 'x', 'Y': 'y', 'Z': 'z'
      };

      const baseMove = keyToMoveMap[key];

      if (baseMove) {
        event.preventDefault();
        const move = isShiftPressed ? `${baseMove}'` : baseMove;
        handleMove(move as Move);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMove, isAnimating]);


  return (
    <main className="bg-gray-900 text-gray-200 min-h-screen w-full flex flex-col items-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4">
        <header className="text-center py-4 w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            Interactive Rubik's Cube
          </h1>
          <p className="text-gray-400 mt-2">Drag the 3D cube to rotate. Use controls or keyboard (e.g., U, Shift+U) to turn faces.</p>
           <div className="w-full max-w-md mt-4 mx-auto">
              <input
                  type="text"
                  placeholder="Type notes here... keyboard shortcuts disabled"
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              />
          </div>
          <div className="w-full max-w-md mt-2 mx-auto flex gap-2">
            <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter rotation formula (e.g., R U R' U')"
                disabled={isAnimating}
                className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition disabled:opacity-50"
            />
            <button
                onClick={handleRunFormula}
                disabled={isAnimating}
                className="px-6 py-2 bg-cyan-600/80 text-white rounded-md hover:bg-cyan-500/80 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnimating ? 'Running...' : 'Run'}
            </button>
          </div>
        </header>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow items-stretch">
            {/* Left column: 2D Projection */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-center items-center gap-2">
                    <button onClick={() => setProjectionType('cross')} disabled={isAnimating} className={`px-4 py-1 rounded-md text-sm font-medium transition ${projectionType === 'cross' ? 'bg-cyan-500 text-white' : 'bg-gray-700/80 hover:bg-gray-600/80'} disabled:opacity-50 disabled:cursor-not-allowed`}>BLD Cross</button>
                    <button onClick={() => setProjectionType('graph')} disabled={isAnimating} className={`px-4 py-1 rounded-md text-sm font-medium transition ${projectionType === 'graph' ? 'bg-cyan-500 text-white' : 'bg-gray-700/80 hover:bg-gray-600/80'} disabled:opacity-50 disabled:cursor-not-allowed`}>Graph</button>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-300">
                    {projectionType === 'cross' ? 'BLD Cross Projection' : '2D Graph Projection'}
                </h2>
                <div className="aspect-square bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                    {projectionType === 'cross' ? <CrossProjection cubeState={cubeState} /> : <Graph2D cubeState={cubeState} />}
                </div>
            </div>
            {/* Right column: 3D View and Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 flex-grow">
                    <h2 className="text-xl font-bold text-center text-gray-300">Interactive 3D Cube</h2>
                    <div className="flex-grow aspect-square lg:aspect-auto bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                        <Cube3D cubeState={cubeState} />
                    </div>
                </div>
                <Controls onMove={handleMove} onShuffle={handleShuffle} onReset={handleReset} isAnimating={isAnimating} />
            </div>
        </div>
      </div>
    </main>
  );
};

export default App;