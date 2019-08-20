// @flow

import React, {Fragment} from 'react';
import UnserializableProps from './UnserializableProps';
import Contexts from './Contexts';
import CustomHooks from './CustomHooks';
import CustomObject from './CustomObject';
import NestedProps from './NestedProps';
import SimpleValues from './SimpleValues';

// TODO Add Immutable JS example

export default function InspectableElements() {
  return (
    <Fragment>
      <h1>Inspectable elements</h1>
      <SimpleValues />
      <UnserializableProps />
      <NestedProps />
      <Contexts />
      <CustomHooks />
      <CustomObject />
    </Fragment>
  );
}
