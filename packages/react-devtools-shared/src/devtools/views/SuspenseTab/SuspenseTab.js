import * as React from 'react';
import portaledContent from '../portaledContent';

function SuspenseTab() {
  return 'Under construction';
}

export default (portaledContent(SuspenseTab): React.ComponentType<{}>);
