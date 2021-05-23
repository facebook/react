/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  ElementTypeClass,
} from 'react-devtools-shared/src/types';

export default function CannotThrowWarningMessage() {
  const store = useContext(StoreContext);
  const areClassComponentsHidden = !!store.componentFilters.find(
    filter =>
      filter.type === ComponentFilterElementType &&
      filter.value === ElementTypeClass &&
      filter.isEnabled,
  );

  // Has the user filtered out class nodes from the tree?
  // If so, the selected element might actually be in an error boundary,
  // but we have no way to know.
  if (areClassComponentsHidden) {
    return (
      <div>
        Error state cannot be toggled while class components are hidden. Disable
        the filter and try again.
      </div>
    );
  } else {
    return <div>The selected element is not within an error boundary.</div>;
  }
}
