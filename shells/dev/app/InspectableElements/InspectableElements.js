// @flow

import React, { Fragment } from 'react';
import FunctionWithState from './FunctionWithState';
import NestedProps from './NestedProps';

export default function InspectableElements() {
  return (
    <Fragment>
      <FunctionWithState initialCount={1} />
      <NestedProps />
    </Fragment>
  );
}
