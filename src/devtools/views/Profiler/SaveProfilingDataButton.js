// @flow

import React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

export default function SaveProfilingDataButton() {
  // TODO (profiling) Support export

  return (
    <Button disabled title="Save profile...">
      <ButtonIcon type="download" />
    </Button>
  );
}
