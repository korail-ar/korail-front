import type { NavigationSegment } from './navigation';

export interface NavigationState {
  status: 'PREVIEW' | 'NAVIGATING' | 'ARRIVED' | 'ERROR';
  segments: NavigationSegment[];
  currentSegmentIndex: number;
}

export type NavigationEvent =
  | { type: 'START_NAVIGATION' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'RESET_NAVIGATION' }
  | { type: 'CONFIRM_ARRIVAL' };

export function navigationReducer(state: NavigationState, event: NavigationEvent): NavigationState {
  switch (event.type) {
    case 'START_NAVIGATION':
      return { ...state, status: 'NAVIGATING', currentSegmentIndex: 0 };
    case 'NEXT_STEP':
      return state.status === 'NAVIGATING'
        ? { ...state, currentSegmentIndex: Math.min(state.currentSegmentIndex + 1, state.segments.length - 1) }
        : state;
    case 'PREVIOUS_STEP':
      return state.status === 'NAVIGATING'
        ? { ...state, currentSegmentIndex: Math.max(state.currentSegmentIndex - 1, 0) }
        : state;
    case 'RESET_NAVIGATION':
      return { ...state, status: 'PREVIEW', currentSegmentIndex: 0 };
    case 'CONFIRM_ARRIVAL':
      return state.status === 'NAVIGATING'
        && state.currentSegmentIndex === state.segments.length - 1
        ? { ...state, status: 'ARRIVED' }
        : state;
    default:
      return state;
  }
}
