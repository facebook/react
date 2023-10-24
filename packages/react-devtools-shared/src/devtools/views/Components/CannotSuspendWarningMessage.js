/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {StoreContext} from '../context';
import {
  ComponentFilterElementType,
  ElementTypeSuspense,
} from 'react-devtools-shared/src/frontend/types';

export default function CannotSuspendWarningMessage(): React.Node {
  const store = useContext(StoreContext);
  const areSuspenseElementsHidden = !!store.componentFilters.find(
    filter =>
      filter.type === ComponentFilterElementType &&
      filter.value === ElementTypeSuspense &&
      filter.isEnabled,
  );

  // Has the user filtered out Suspense nodes from the tree?
  // If so, the selected element might actually be in a Suspense tree after all.
  if (areSuspenseElementsHidden) {
    return (
      <div>
        Suspended state cannot be toggled while Suspense components are hidden.
        Disable the filter and try again.
      </div>
    );
  } else {
    return (
      <div>
        The selected element is not within a Suspense container. Suspending it
        would cause an error.
      </div>
    );
  }
}
