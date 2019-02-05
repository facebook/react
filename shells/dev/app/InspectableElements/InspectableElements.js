// @flow

import React, { Fragment } from 'react';
import Contexts from './Contexts';
import FunctionWithState from './FunctionWithState';
import NestedProps from './NestedProps';

export default function InspectableElements() {
  return (
    <Fragment>
      <FunctionWithState initialCount={1} />
      <NestedProps />
      <Contexts />
    </Fragment>
  );
}
