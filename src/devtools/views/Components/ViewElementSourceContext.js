// @flow

import { createContext } from 'react';

const ViewElementSourceContext = createContext<Function | null>(null);
ViewElementSourceContext.displayName = 'ViewElementSourceContext';

export default ViewElementSourceContext;
