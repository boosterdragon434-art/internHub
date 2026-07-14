import { useReducer, useCallback, useRef } from 'react';

/**
 * useCanvasHistory — Evolved from the existing AdvancedEditor's hand-rolled undo/redo array.
 * Proper useReducer-based state management with configurable max snapshots.
 * Saves checkpoints on explicit actions (not during live-drag).
 */

const MAX_HISTORY = 50;

const ACTIONS = {
  PUSH: 'PUSH',
  UNDO: 'UNDO',
  REDO: 'REDO',
  REPLACE_CURRENT: 'REPLACE_CURRENT',
  MARK_SAVED: 'MARK_SAVED',
  RESET: 'RESET',
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.PUSH: {
      // Trim future states when pushing after an undo
      const trimmed = state.history.slice(0, state.index + 1);
      const next = [...trimmed, action.payload];
      // Cap at MAX_HISTORY, drop oldest if needed
      const capped = next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      const newIndex = capped.length - 1;
      return {
        ...state,
        history: capped,
        index: newIndex,
        // Adjust savedIndex if entries were pruned
        savedIndex: state.savedIndex >= 0
          ? Math.max(0, state.savedIndex - (next.length - capped.length))
          : state.savedIndex,
      };
    }
    case ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return { ...state, index: state.index - 1 };
    }
    case ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return { ...state, index: state.index + 1 };
    }
    case ACTIONS.REPLACE_CURRENT: {
      // Replace current state without adding history (for live-drag updates)
      const updated = [...state.history];
      updated[state.index] = action.payload;
      return { ...state, history: updated };
    }
    case ACTIONS.MARK_SAVED: {
      return { ...state, savedIndex: state.index };
    }
    case ACTIONS.RESET: {
      return {
        history: [action.payload],
        index: 0,
        savedIndex: 0,
      };
    }
    default:
      return state;
  }
};

/**
 * @param {Array} initialState - Initial overlays/pages state
 * @returns {object} History management API
 */
const useCanvasHistory = (initialState = []) => {
  const [state, dispatch] = useReducer(reducer, {
    history: [initialState],
    index: 0,
    savedIndex: 0,
  });

  const isDragging = useRef(false);

  /** Push a new checkpoint to the history stack */
  const pushState = useCallback((newState) => {
    dispatch({ type: ACTIONS.PUSH, payload: newState });
  }, []);

  /** Replace current state without adding history (for live-drag) */
  const replaceCurrent = useCallback((newState) => {
    dispatch({ type: ACTIONS.REPLACE_CURRENT, payload: newState });
  }, []);

  /** Undo to previous state */
  const undo = useCallback(() => {
    dispatch({ type: ACTIONS.UNDO });
  }, []);

  /** Redo to next state */
  const redo = useCallback(() => {
    dispatch({ type: ACTIONS.REDO });
  }, []);

  /** Mark the current state as saved (for unsaved changes detection) */
  const markSaved = useCallback(() => {
    dispatch({ type: ACTIONS.MARK_SAVED });
  }, []);

  /** Reset history to a new initial state */
  const reset = useCallback((newState) => {
    dispatch({ type: ACTIONS.RESET, payload: newState });
  }, []);

  /** Start a drag operation (disables history pushes) */
  const startDrag = useCallback(() => {
    isDragging.current = true;
  }, []);

  /** End a drag operation and push final state as checkpoint */
  const endDrag = useCallback((finalState) => {
    isDragging.current = false;
    if (finalState) {
      dispatch({ type: ACTIONS.PUSH, payload: finalState });
    }
  }, []);

  const currentState = state.history[state.index] || initialState;
  const canUndo = state.index > 0;
  const canRedo = state.index < state.history.length - 1;
  const hasUnsavedChanges = state.index !== state.savedIndex;

  return {
    currentState,
    pushState,
    replaceCurrent,
    undo,
    redo,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    markSaved,
    reset,
    startDrag,
    endDrag,
    isDragging,
    historyLength: state.history.length,
    historyIndex: state.index,
  };
};

export default useCanvasHistory;
