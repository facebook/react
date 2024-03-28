export const STRATEGY = {
  SYNC: 'sync',
  DEBOUNCED: 'debounced',
  ASYNC: 'async',
};

export const OPTIONS = [
  {
    strategy: STRATEGY.SYNC,
    label: 'Synchronous',
  },
  {
    strategy: STRATEGY.DEBOUNCED,
    label: 'Debounced',
  },
  {
    strategy: STRATEGY.ASYNC,
    label: 'Concurrent',
  },
];

export const INITIAL_STATE = {
  value: '',
  strategy: STRATEGY.SYNC,
  showDemo: true,
  showClock: false,
};

export const COLORS = ['#fff489', '#fa57c1', '#b166cc', '#7572ff', '#69a6f9'];

export const SPEED = 0.003 / Math.PI;
export const FRAMES = 10;

export const QUESTION_MARK = '?';
