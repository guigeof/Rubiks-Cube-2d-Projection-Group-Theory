import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Cube3D } from './components/Cube3D';
import { Graph2D } from './components/Graph2D';
import { Controls } from './components/Controls';
import { INITIAL_CUBE_STATE, COLORS, CUBE_PIECES, BLD_ALPHABET } from './constants';
import { applyMove } from './services/cubeLogic';
import type { CubeState, Move, FaceState, FaceName, Sticker } from './types';

// Audio Context for click sounds
let audioContext: AudioContext | null = null;
const playClickSound = (pitch: number = 880, options: { duration?: number, volume?: number } = {}) => {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch(e) {
            console.error("Web Audio API is not supported in this browser");
            return;
        }
    }
    const { duration = 0.1, volume = 0.3 } = options;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(pitch, audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};


const ArrowIcon = () => (
  <svg viewBox="0 0 10 10" className="w-1/2 h-1/2 text-black/40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0 L10 5 H7 L7 10 H3 L3 5 H0 Z" />
  </svg>
);

interface FaceDisplayProps {
  faceState: FaceState;
  faceName: FaceName;
  withCircles?: boolean;
  highlightedIds: Set<string> | null;
  onStickerClick: (stickerId: string) => void;
  showBld: boolean;
}

const FaceDisplay: React.FC<FaceDisplayProps> = ({ faceState, faceName, withCircles = false, highlightedIds, onStickerClick, showBld }) => {
  return (
    <div className="relative w-24 h-24">
      <div className="grid grid-cols-3 grid-rows-3 gap-px bg-black w-full h-full p-0.5 rounded-sm">
        {faceState.flat().map((sticker, i) => {
          const isHighlighted = highlightedIds?.has(sticker.id);
          const bldLetter = BLD_ALPHABET[sticker.id];
          return (
            <div 
              key={`${faceName}-${i}`} 
              className={`relative w-full h-full ${COLORS[sticker.color]} rounded-sm flex items-center justify-center cursor-pointer`}
              onClick={() => onStickerClick(sticker.id)}
            >
               <div className={`transition-transform duration-200 ${showBld && bldLetter ? 'opacity-20' : ''}`} style={{transform: `rotate(${sticker.rotation}deg)`}}>
                  <ArrowIcon />
              </div>
              {showBld && bldLetter && (
                <span className="absolute font-bold text-black/70 text-lg select-none">{bldLetter}</span>
              )}
              {isHighlighted && <div className="absolute inset-0 ring-2 ring-pink-500 ring-inset" />}
            </div>
          )
        })}
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

const CrossProjection: React.FC<{ 
  cubeState: CubeState; 
  highlightedIds: Set<string> | null; 
  onStickerClick: (stickerId: string) => void;
  showBld: boolean;
  view: 'U' | 'F';
}> = ({ cubeState, highlightedIds, onStickerClick, showBld, view }) => {
  if (view === 'F') {
    return (
       <div className="w-full h-full flex items-center justify-center p-4">
        <div className="grid grid-cols-4 grid-rows-3 gap-1 place-items-center">
            <div className="col-start-2"><FaceDisplay faceState={cubeState.U} faceName="U" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-1 row-start-2"><FaceDisplay faceState={cubeState.L} faceName="L" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-2 row-start-2"><FaceDisplay faceState={cubeState.F} faceName="F" withCircles highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-3 row-start-2"><FaceDisplay faceState={cubeState.R} faceName="R" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-4 row-start-2"><FaceDisplay faceState={cubeState.B} faceName="B" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-2 row-start-3"><FaceDisplay faceState={cubeState.D} faceName="D" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
        </div>
    </div>
    )
  }
  // Default U-centered view
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
        <div className="grid grid-cols-4 grid-rows-3 gap-1 place-items-center">
            <div className="col-start-2"><FaceDisplay faceState={cubeState.U} faceName="U" withCircles highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-1 row-start-2"><FaceDisplay faceState={cubeState.L} faceName="L" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-2 row-start-2"><FaceDisplay faceState={cubeState.F} faceName="F" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-3 row-start-2"><FaceDisplay faceState={cubeState.R} faceName="R" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-4 row-start-2"><FaceDisplay faceState={cubeState.B} faceName="B" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
            <div className="col-start-2 row-start-3"><FaceDisplay faceState={cubeState.D} faceName="D" highlightedIds={highlightedIds} onStickerClick={onStickerClick} showBld={showBld} /></div>
        </div>
    </div>
  );
};

const parseFormula = (formula: string): Move[] => {
    const validMoves: Move[] = [
      'U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2',
      'M', "M'", 'M2', 'E', "E'", 'E2', 'S', "S'", 'S2', 'x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2'
    ];
    const moveSet = new Set(validMoves);
    const tokens = formula.trim().split(/\s+/);
    const parsedMoves: Move[] = [];

    for (const token of tokens) {
        if (moveSet.has(token as Move)) {
            parsedMoves.push(token as Move);
        }
    }
    return parsedMoves;
};

type KeymapPreset = 'numpad' | 'graph' | 'user';

const keymapPresets: Record<KeymapPreset, { name: string; map: { [key: string]: Move } }> = {
  numpad: {
    name: "Numpad Layout",
    map: { '7': 'S', '8': "E'", '9': "M'", '4': 'F', '5': 'U', '6': 'R', '1': "B'", '2': "D'", '3': "L'" }
  },
  graph: {
    name: "Graph Grouping",
    map: { '5': 'U', '8': "E'", '2': "D'", '1': 'F', '4': 'S', '7': "B'", '3': 'R', '6': "M'", '9': "L'" }
  },
  user: {
    name: "User Defined",
    map: { '1': 'F', '5': 'U', '3': 'R', '4': "B'", '2': "D'", '6': "L'", '7': 'S', '8': "E'", '9': "M'" }
  }
};

const KeyboardCheatSheet: React.FC<{ preset: KeymapPreset }> = ({ preset }) => {
    const currentMap = keymapPresets[preset].map;

    const renderNumpadLayout = () => (
        <>
            <h4 className="font-bold text-center text-gray-300">Numpad Layout</h4>
            <p className="text-center text-xs text-gray-400 -mt-2">Matches numpad rows to circle types.</p>
             <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-gray-400 items-center font-mono">
                <div className="col-span-3 font-sans font-semibold text-gray-200 text-center mb-1">Top Row: Middle Circles</div>
                {['7', '8', '9'].map(key => <div key={key} className="text-center p-1 bg-gray-700/50 rounded">{key} = {currentMap[key]}</div>)}

                <div className="col-span-3 font-sans font-semibold text-gray-200 text-center mt-2 mb-1">Middle Row: Inner Circles</div>
                {['4', '5', '6'].map(key => <div key={key} className="text-center p-1 bg-gray-700/50 rounded">{key} = {currentMap[key]}</div>)}
                
                <div className="col-span-3 font-sans font-semibold text-gray-200 text-center mt-2 mb-1">Bottom Row: Outer Circles</div>
                {['1', '2', '3'].map(key => <div key={key} className="text-center p-1 bg-gray-700/50 rounded">{key} = {currentMap[key]}</div>)}
            </div>
        </>
    );

    const renderGraphGrouping = () => (
         <>
            <h4 className="font-bold text-center text-gray-300">Graph Grouping</h4>
            <p className="text-center text-xs text-gray-400 -mt-2">Groups keys by graph axes.</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-gray-400 items-center font-mono">
                <div className="col-span-1 font-sans font-semibold text-gray-200 text-center">F-Set</div>
                <div className="col-span-1 font-sans font-semibold text-gray-200 text-center">U-Set</div>
                <div className="col-span-1 font-sans font-semibold text-gray-200 text-center">R-Set</div>
                
                <div className="text-center p-1 bg-gray-700/50 rounded">1={currentMap['1']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">5={currentMap['5']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">3={currentMap['3']}</div>
                
                <div className="text-center p-1 bg-gray-700/50 rounded">4={currentMap['4']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">8={currentMap['8']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">6={currentMap['6']}</div>

                <div className="text-center p-1 bg-gray-700/50 rounded">7={currentMap['7']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">2={currentMap['2']}</div>
                <div className="text-center p-1 bg-gray-700/50 rounded">9={currentMap['9']}</div>
            </div>
        </>
    );
    
    const renderUserDefined = () => (
         <>
            <h4 className="font-bold text-center text-gray-300">User Defined</h4>
            <p className="text-center text-xs text-gray-400 -mt-2">Matches clockwise circle rotation.</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-gray-400 items-center font-mono">
                 {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                    <div key={key} className="text-center p-1 bg-gray-700/50 rounded">{key}={currentMap[key]}</div>
                ))}
            </div>
        </>
    );

    return (
        <div className="p-4 rounded-lg bg-gray-900/50 flex flex-col gap-3 text-sm">
            <h3 className="text-lg font-bold text-center text-gray-300">Keyboard Shortcuts</h3>
            <p className="text-center text-xs text-gray-400 -mt-2">Use <kbd className="font-mono bg-gray-700/80 px-1.5 py-0.5 rounded">Shift</kbd> for counter-clockwise / inverse moves.</p>
            
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-gray-400 text-center items-center">
                <div className="col-span-2 font-semibold text-gray-200 mt-1">Standard Controls</div>
                <kbd className="font-mono bg-gray-700/80 px-2 py-0.5 rounded">U/D/L/R/F/B</kbd>
                <div className="text-left pl-2">Face Turns</div>
                <kbd className="font-mono bg-gray-700/80 px-2 py-0.5 rounded">M/E/S</kbd>
                <div className="text-left pl-2">Slice Turns</div>
                <kbd className="font-mono bg-gray-700/80 px-2 py-0.5 rounded">X/Y/Z</kbd>
                <div className="text-left pl-2">Cube Rotations</div>
                <kbd className="font-mono bg-gray-700/80 px-2 py-0.5 rounded">I</kbd>
                <div className="text-left pl-2">Next Piece (Identify)</div>
            </div>

            <div className="border-t border-gray-700/50 my-1"></div>
            
            {preset === 'numpad' && renderNumpadLayout()}
            {preset === 'graph' && renderGraphGrouping()}
            {preset === 'user' && renderUserDefined()}
        </div>
    );
};


const App: React.FC = () => {
  const [cubeState, setCubeState] = useState<CubeState>(INITIAL_CUBE_STATE);
  const [formula, setFormula] = useState('');
  const [scramble, setScramble] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedPieceIndex, setHighlightedPieceIndex] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBld, setShowBld] = useState(false);
  const [crossView, setCrossView] = useState<'U' | 'F'>('U');
  const [keymapPreset, setKeymapPreset] = useState<KeymapPreset>('user');
  const [animatedFace, setAnimatedFace] = useState<{ face: FaceName, clockwise: boolean } | null>(null);
  const [showHighlightZones, setShowHighlightZones] = useState(false);
  const [showEdgeSketches, setShowEdgeSketches] = useState(false);
  const [showNodeCoords, setShowNodeCoords] = useState(false);
  const [showCornerSketches, setShowCornerSketches] = useState(true);
  const [showCircleColors, setShowCircleColors] = useState(true);
  const animationTimeoutRef = useRef<number | null>(null);

  const highlightedIds = useMemo(() => {
    if (highlightedPieceIndex === null) return null;
    return new Set(CUBE_PIECES[highlightedPieceIndex]);
  }, [highlightedPieceIndex]);

  const handleMove = useCallback(async (move: Move, options: { playSound: boolean } = { playSound: true }) => {
    const isDoubleMove = move.endsWith('2');
    const baseMove = isDoubleMove ? (move.slice(0, -1) as Move) : move;
    const numTurns = isDoubleMove ? 2 : 1;
    
    for (let i = 0; i < numTurns; i++) {
        if (options.playSound) {
            playClickSound();
        }
        
        setCubeState(prevState => applyMove(prevState, baseMove));
        
        const faceName = baseMove.replace("'", "")[0].toUpperCase() as FaceName;
        const faceNames: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];

        if (faceNames.includes(faceName)) {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            setAnimatedFace({ face: faceName, clockwise: !baseMove.includes("'") });
            animationTimeoutRef.current = window.setTimeout(() => {
                setAnimatedFace(null);
            }, 300);
        }
        
        if (isDoubleMove && i === 0) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }
  }, []);
  
  const handleStickerClick = useCallback((stickerId: string) => {
    const pieceIndex = CUBE_PIECES.findIndex(piece => piece.includes(stickerId));
    if (pieceIndex !== -1) {
      setHighlightedPieceIndex(pieceIndex);
    }
  }, []);

  const handleClearHighlight = useCallback(() => setHighlightedPieceIndex(null), []);

  const handleNextPiece = useCallback(() => {
    setHighlightedPieceIndex(prev => (prev === null || prev >= CUBE_PIECES.length - 1) ? 0 : prev + 1);
  }, []);

  const handlePrevPiece = useCallback(() => {
    setHighlightedPieceIndex(prev => (prev === null || prev <= 0) ? CUBE_PIECES.length - 1 : prev - 1);
  }, []);

  const handleReset = useCallback(() => {
    if (isAnimating) return;
    setCubeState(INITIAL_CUBE_STATE);
    handleClearHighlight();
    setScramble('');
  }, [isAnimating, handleClearHighlight]);

  const handleShuffle = useCallback(() => {
    if (isAnimating) return;
    let state = JSON.parse(JSON.stringify(INITIAL_CUBE_STATE));
    const baseMoves: Move[] = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    
    let scrambleMoves: string[] = [];
    let lastAxis = '';
    for (let i = 0; i < 25; i++) {
        let randomBaseMove: Move;
        do {
            randomBaseMove = baseMoves[Math.floor(Math.random() * baseMoves.length)];
        } while (randomBaseMove[0] === lastAxis);
        lastAxis = randomBaseMove[0];

        const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        const moveStr = `${randomBaseMove}${randomModifier}`;
        scrambleMoves.push(moveStr);
        const parsed = parseFormula(moveStr);
        for(const m of parsed) {
            const isDouble = m.endsWith('2');
            const base = isDouble ? m.slice(0, -1) as Move : m;
            state = applyMove(state, base);
            if(isDouble) {
                state = applyMove(state, base);
            }
        }
    }
    setScramble(scrambleMoves.join(' '));
    setCubeState(state);
    handleClearHighlight();
  }, [isAnimating, handleClearHighlight]);

  const handleRunFormula = useCallback(async () => {
    const moves = parseFormula(formula);
    if (moves.length === 0 || isAnimating) return;

    setIsAnimating(true);
    for (const move of moves) {
        await handleMove(move);
        if (moves.indexOf(move) < moves.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
    }
    setIsAnimating(false);
  }, [formula, handleMove, isAnimating]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAnimating || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toUpperCase();
      const isShiftPressed = event.shiftKey;

      if (key === 'I') {
        event.preventDefault();
        isShiftPressed ? handlePrevPiece() : handleNextPiece();
        return;
      }

      const standardKeyMap: { [key: string]: Move } = {
        'U': 'U', 'D': 'D', 'L': 'L', 'R': 'R', 'F': 'F', 'B': 'B',
        'M': 'M', 'E': 'E', 'S': 'S',
        'X': 'x', 'Y': 'y', 'Z': 'z',
      };
      
      const numpadMap = keymapPresets[keymapPreset].map;
      
      const keyToMoveMap = { ...standardKeyMap, ...numpadMap };

      const baseMove = keyToMoveMap[key];

      if (baseMove) {
        event.preventDefault();
        let move: Move;
        if (isShiftPressed) {
            if (baseMove.includes("'")) {
                move = baseMove.replace("'", "") as Move;
            } else if (baseMove.endsWith('2')) {
                move = baseMove; // Shift doesn't affect double moves
            } else {
                move = `${baseMove}'` as Move;
            }
        } else {
            move = baseMove;
        }
        handleMove(move);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMove, isAnimating, handleNextPiece, handlePrevPiece, keymapPreset]);


  return (
    <main className="bg-gray-900 text-gray-200 min-h-screen w-full flex flex-col items-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4">
        <header className="text-center py-2 w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            Interactive Rubik's Cube
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-400 mt-2">Drag 3D cube to rotate. Use controls or keyboard.</p>
            <button onClick={() => setShowShortcuts(s => !s)} className="mt-2 px-3 py-1 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
              {showShortcuts ? 'Hide' : 'Show'} Shortcuts
            </button>
          </div>
           <div className="w-full max-w-2xl mt-4 mx-auto">
              <input
                  type="text"
                  placeholder="Type notes here... keyboard shortcuts disabled"
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              />
          </div>
          <div className="w-full max-w-2xl mt-2 mx-auto flex gap-2">
            <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter rotation formula (e.g., R U R' U2)"
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
          {scramble && (
            <div className="w-full max-w-2xl mt-3 mx-auto p-2 bg-gray-800/60 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">Current Scramble:</p>
                <p className="font-mono text-sm text-cyan-300">{scramble}</p>
            </div>
          )}
        </header>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow items-stretch">
            {/* Left column: 2D Projections */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-4">
                        <h2 className="text-xl font-bold text-gray-300">BLD Cross Projection</h2>
                        <button onClick={() => setShowBld(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">{showBld ? 'Hide' : 'Show'} BLD Letters</button>
                        <button onClick={() => setCrossView(v => v === 'U' ? 'F' : 'U')} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">Switch Cross View</button>
                    </div>
                    <div className="aspect-square bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                        <CrossProjection cubeState={cubeState} highlightedIds={highlightedIds} onStickerClick={handleStickerClick} showBld={showBld} view={crossView}/>
                    </div>
                </div>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-300">
                            2D Graph Projection
                        </h2>
                        <button onClick={() => setShowHighlightZones(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
                            {showHighlightZones ? 'Hide' : 'Show'} Zones
                        </button>
                         <button onClick={() => setShowEdgeSketches(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
                            {showEdgeSketches ? 'Hide' : 'Show'} Edges
                        </button>
                        <button onClick={() => setShowCornerSketches(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
                            {showCornerSketches ? 'Hide' : 'Show'} Pieces
                        </button>
                        <button onClick={() => setShowCircleColors(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
                            {showCircleColors ? 'Hide' : 'Show'} Colors
                        </button>
                        <button onClick={() => setShowNodeCoords(s => !s)} className="px-2 py-0.5 text-xs bg-gray-700/80 rounded-md hover:bg-gray-600/80">
                            {showNodeCoords ? 'Hide' : 'Show'} Coords
                        </button>
                    </div>
                    <div className="aspect-square bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                        <Graph2D cubeState={cubeState} highlightedIds={highlightedIds} onStickerClick={handleStickerClick} showBld={showBld} onMove={handleMove} playClickSound={playClickSound} showHighlightZones={showHighlightZones} showEdgeSketches={showEdgeSketches} showNodeCoords={showNodeCoords} showCornerSketches={showCornerSketches} showCircleColors={showCircleColors} />
                    </div>
                </div>
            </div>
            {/* Right column: 3D View and Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 flex-grow">
                    <h2 className="text-xl font-bold text-center text-gray-300">Interactive 3D Cube</h2>
                    <div className="flex-grow aspect-square lg:aspect-auto bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50">
                        <Cube3D 
                           cubeState={cubeState} 
                           highlightedIds={highlightedIds} 
                           onStickerClick={handleStickerClick} 
                           showBld={showBld} 
                           onMove={handleMove}
                           animatedFace={animatedFace}
                        />
                    </div>
                </div>
                 {showShortcuts && (
                    <div className="flex flex-col gap-2">
                         <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-300">Numpad Preset</h3>
                             <div className="flex justify-center gap-2 mt-2">
                                {(Object.keys(keymapPresets) as KeymapPreset[]).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => setKeymapPreset(key)}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            keymapPreset === key
                                                ? 'bg-cyan-600 text-white font-semibold'
                                                : 'bg-gray-700/80 hover:bg-gray-600/80'
                                        }`}
                                    >
                                        {keymapPresets[key].name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <KeyboardCheatSheet preset={keymapPreset} />
                    </div>
                 )}
                <Controls 
                    onMove={handleMove} 
                    onShuffle={handleShuffle} 
                    onReset={handleReset} 
                    isAnimating={isAnimating}
                    onPrevPiece={handlePrevPiece}
                    onNextPiece={handleNextPiece}
                    onClearHighlight={handleClearHighlight}
                />
            </div>
        </div>
      </div>
    </main>
  );
};

export default App;
