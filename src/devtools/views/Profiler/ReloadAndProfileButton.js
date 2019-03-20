// @flow

import React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

export default function ReloadAndProfileButton() {
  // TODO (profiling) Wire up reload button
  return (
    <Button disabled title="Reload and start profiling">
      <ButtonIcon type="reload" />
    </Button>
  );
}
