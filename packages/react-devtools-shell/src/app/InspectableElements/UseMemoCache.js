import * as React from 'react';

export default function UseMemoCache(): React.Node {
  React.unstable_useMemoCache(1);

  return null;
}
