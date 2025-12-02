// @loggerTestOnly @validateNoSetStateInEffects
import React, {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const [state2, setState2] = React.useState(0);
  useEffect(() => {
    setState(s => s + 1);
  });
  React.useEffect(() => {
    setState2(s => s + 1);
  });
  return state + state2;
}
