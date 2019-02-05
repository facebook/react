// @flow

import { dehydrate } from '../hydration';

import type { DehydratedData } from 'src/devtools/types';

export function cleanForBridge(data: Object | null): DehydratedData | null {
  if (data !== null) {
    const cleaned = [];

    return {
      data: dehydrate(data, cleaned),
      cleaned,
    };
  } else {
    return null;
  }
}
