import {parse} from '@babel/parser';

export function workerizedParse(...params) {
  return parse(...params);
}
