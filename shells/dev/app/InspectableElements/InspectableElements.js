// @flow

import React, { Fragment } from 'react';
import Contexts from './Contexts';
import CustomHooks from './CustomHooks';
import CustomObject from './CustomObject';
import Hydration from './Hydration';
import NestedProps from './NestedProps';

// TODO Add Immutable JS example

export default function InspectableElements() {
  return (
    <Fragment>
      <h1>Inspectable elements</h1>
      <NestedProps />
      <Contexts />
      <CustomHooks />
      <CustomObject />
      <Hydration />
    </Fragment>
  );
}
