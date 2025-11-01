import type { CubeState, FaceState, Move, Sticker } from '../types';

const rotateFace = (face: FaceState, clockwise: boolean): FaceState => {
  const oldFace: FaceState = face.map(row => [...row]);
  let newFace: FaceState;
  if (clockwise) {
    newFace = [
      [oldFace[2][0], oldFace[1][0], oldFace[0][0]],
      [oldFace[2][1], oldFace[1][1], oldFace[0][1]],
      // FIX: Corrected typo from `oldState` to `oldFace`.
      [oldFace[2][2], oldFace[1][2], oldFace[0][2]],
    ];
  } else {
    newFace = [
      [oldFace[0][2], oldFace[1][2], oldFace[2][2]],
      [oldFace[0][1], oldFace[1][1], oldFace[2][1]],
      [oldFace[0][0], oldFace[1][0], oldFace[2][0]],
    ];
  }
  const rotationDelta = clockwise ? 90 : -90;
  return newFace.map(row => 
    row.map(sticker => ({ ...sticker, rotation: (sticker.rotation + rotationDelta + 360) % 360 }))
  );
};

const rotateSticker = (sticker: Sticker, degrees: number): Sticker => ({
    ...sticker,
    rotation: (sticker.rotation + degrees + 360) % 360,
});

const applyMoves = (state: CubeState, moves: Move[]): CubeState => moves.reduce((s, m) => applyMove(s, m), state);

export const applyMove = (state: CubeState, move: Move): CubeState => {
  const newState = JSON.parse(JSON.stringify(state));
  const oldState = JSON.parse(JSON.stringify(state));

  switch (move) {
    // Face Rotations
    case 'U':
      newState.U = rotateFace(oldState.U, true);
      [newState.F[0], newState.R[0], newState.B[0], newState.L[0]] = 
      [oldState.R[0], oldState.B[0], oldState.L[0], oldState.F[0]];
      break;
    case "U'":
      newState.U = rotateFace(oldState.U, false);
      [newState.F[0], newState.R[0], newState.B[0], newState.L[0]] = 
      [oldState.L[0], oldState.F[0], oldState.R[0], oldState.B[0]];
      break;
    case 'D':
      newState.D = rotateFace(oldState.D, true);
      [newState.F[2], newState.L[2], newState.B[2], newState.R[2]] = 
      [oldState.L[2], oldState.B[2], oldState.R[2], oldState.F[2]];
      break;
    case "D'":
      newState.D = rotateFace(oldState.D, false);
      [newState.F[2], newState.R[2], newState.B[2], newState.L[2]] = 
      [oldState.R[2], oldState.B[2], oldState.L[2], oldState.F[2]];
      break;
    case 'L':
      newState.L = rotateFace(oldState.L, true);
      for(let i=0; i<3; i++) {
        newState.U[i][0] = oldState.B[2-i][2];
        newState.B[2-i][2] = oldState.D[i][0];
        newState.D[i][0] = oldState.F[i][0];
        newState.F[i][0] = oldState.U[i][0];
      }
      break;
    case "L'":
      newState.L = rotateFace(oldState.L, false);
      for(let i=0; i<3; i++) {
        newState.U[i][0] = oldState.F[i][0];
        newState.F[i][0] = oldState.D[i][0];
        newState.D[i][0] = oldState.B[2-i][2];
        newState.B[2-i][2] = oldState.U[i][0];
      }
      break;
    case 'R':
      newState.R = rotateFace(oldState.R, true);
      for(let i=0; i<3; i++) {
        newState.U[i][2] = oldState.F[i][2];
        newState.F[i][2] = oldState.D[i][2];
        newState.D[i][2] = oldState.B[2-i][0];
        newState.B[2-i][0] = oldState.U[i][2];
      }
      break;
    case "R'":
      newState.R = rotateFace(oldState.R, false);
      for(let i=0; i<3; i++) {
        newState.U[i][2] = oldState.B[2-i][0];
        newState.B[2-i][0] = oldState.D[i][2];
        newState.D[i][2] = oldState.F[i][2];
        newState.F[i][2] = oldState.U[i][2];
      }
      break;
    case 'F':
      newState.F = rotateFace(oldState.F, true);
      for(let i=0; i<3; i++) {
        newState.U[2][i] = rotateSticker(oldState.L[2-i][2], 90);
        newState.L[2-i][2] = rotateSticker(oldState.D[0][2-i], 90);
        newState.D[0][2-i] = rotateSticker(oldState.R[i][0], 90);
        newState.R[i][0] = rotateSticker(oldState.U[2][i], 90);
      }
      break;
    case "F'":
      newState.F = rotateFace(oldState.F, false);
      for(let i=0; i<3; i++) {
        newState.U[2][i] = rotateSticker(oldState.R[i][0], -90);
        newState.R[i][0] = rotateSticker(oldState.D[0][2-i], -90);
        newState.D[0][2-i] = rotateSticker(oldState.L[2-i][2], -90);
        newState.L[2-i][2] = rotateSticker(oldState.U[2][i], -90);
      }
      break;
    case 'B':
      newState.B = rotateFace(oldState.B, true);
      for(let i=0; i<3; i++) {
        newState.U[0][i] = rotateSticker(oldState.R[i][2], -90);
        newState.R[i][2] = rotateSticker(oldState.D[2][2-i], -90);
        newState.D[2][2-i] = rotateSticker(oldState.L[2-i][0], -90);
        newState.L[2-i][0] = rotateSticker(oldState.U[0][i], -90);
      }
      break;
    case "B'":
      newState.B = rotateFace(oldState.B, false);
      for(let i=0; i<3; i++) {
        newState.U[0][i] = rotateSticker(oldState.L[2-i][0], 90);
        newState.L[2-i][0] = rotateSticker(oldState.D[2][2-i], 90);
        newState.D[2][2-i] = rotateSticker(oldState.R[i][2], 90);
        newState.R[i][2] = rotateSticker(oldState.U[0][i], 90);
      }
      break;

    // Middle Slice Rotations
    case 'E':
      [newState.F[1], newState.R[1], newState.B[1], newState.L[1]] = 
      [oldState.L[1], oldState.F[1], oldState.R[1], oldState.B[1]];
      break;
    case "E'":
      [newState.F[1], newState.R[1], newState.B[1], newState.L[1]] = 
      [oldState.R[1], oldState.B[1], oldState.L[1], oldState.F[1]];
      break;
    case 'M':
      for(let i=0; i<3; i++) {
        newState.U[i][1] = oldState.B[2-i][1];
        newState.B[2-i][1] = oldState.D[i][1];
        newState.D[i][1] = oldState.F[i][1];
        newState.F[i][1] = oldState.U[i][1];
      }
      break;
    case "M'":
      for(let i=0; i<3; i++) {
        newState.U[i][1] = oldState.F[i][1];
        newState.F[i][1] = oldState.D[i][1];
        newState.D[i][1] = oldState.B[2-i][1];
        newState.B[2-i][1] = oldState.U[i][1];
      }
      break;
    case 'S':
      for(let i=0; i<3; i++) {
        newState.U[1][i] = rotateSticker(oldState.L[2-i][1], 90);
        newState.L[2-i][1] = rotateSticker(oldState.D[1][2-i], 90);
        newState.D[1][2-i] = rotateSticker(oldState.R[i][1], 90);
        newState.R[i][1] = rotateSticker(oldState.U[1][i], 90);
      }
      break;
    case "S'":
      for(let i=0; i<3; i++) {
        newState.U[1][i] = rotateSticker(oldState.R[i][1], -90);
        newState.R[i][1] = rotateSticker(oldState.D[1][2-i], -90);
        newState.D[1][2-i] = rotateSticker(oldState.L[2-i][1], -90);
        newState.L[2-i][1] = rotateSticker(oldState.U[1][i], -90);
      }
      break;
    
    // Whole Cube Rotations
    case 'z': return applyMoves(state, ['U', "E'", "D'"]);
    case "z'": return applyMoves(state, ["U'", 'E', 'D']);
    case 'y': return applyMoves(state, ['R', "M'", "L'"]);
    case "y'": return applyMoves(state, ["R'", 'M', 'L']);
    case 'x': return applyMoves(state, ['F', 'S', "B'"]);
    case "x'": return applyMoves(state, ["F'", "S'", 'B']);
    default:
        return state;
  }
  return newState;
};