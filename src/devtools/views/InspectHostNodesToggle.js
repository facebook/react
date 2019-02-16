// @flow

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { BridgeContext } from './context';
import Toggle from './Toggle';
import ButtonIcon from './ButtonIcon';

export default function InspectHostNodesToggle() {
  const [isInspecting, setIsInspecting] = useState(false);
  const bridge = useContext(BridgeContext);

  const handleChange = useCallback(
    (isChecked: boolean) => {
      setIsInspecting(isChecked);

      if (isChecked) {
        bridge.send('startInspectingDOM');
      } else {
        bridge.send('stopInspectingDOM');
      }
    },
    [bridge]
  );

  useEffect(() => {
    const onStopInspectingDOM = () => setIsInspecting(false);
    bridge.addListener('stopInspectingDOM', onStopInspectingDOM);
    return () =>
      bridge.removeListener('stopInspectingDOM', onStopInspectingDOM);
  }, [bridge]);

  return (
    <Toggle
      onChange={handleChange}
      isChecked={isInspecting}
      title="Select an element in the page to inspect it"
    >
      <ButtonIcon type="search" />
    </Toggle>
  );
}
