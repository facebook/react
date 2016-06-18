import {getSymbolIterator} from '../../src/facade/lang';

export class TestIterable {
  list: number[];
  constructor() { this.list = []; }

  [getSymbolIterator()]() { return (this.list as any)[getSymbolIterator()](); }
}
