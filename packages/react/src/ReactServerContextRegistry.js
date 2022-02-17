import type {ReactServerContext} from 'shared/ReactTypes';

export const globalServerContextRegistry: {
  [globalName: string]: ReactServerContext<any>,
} = {
  __defaultValue: {},
};
