import type {ReactServerContext} from 'shared/ReactTypes';

export const ContextRegistry: {
  [globalName: string]: ReactServerContext<any>,
} = {};
