// @flow

import { createContext } from 'react';

import type {
  CanViewElementSource,
  ViewElementSource,
} from 'src/devtools/views/DevTools';

export type Context = {|
  canViewElementSourceFunction: CanViewElementSource | null,
  viewElementSourceFunction: ViewElementSource | null,
|};

const ViewElementSourceContext = createContext<Context>(((null: any): Context));
ViewElementSourceContext.displayName = 'ViewElementSourceContext';

export default ViewElementSourceContext;
