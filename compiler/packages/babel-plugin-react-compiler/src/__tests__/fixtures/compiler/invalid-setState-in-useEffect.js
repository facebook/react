// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import React, {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(s => s + 1);
  });
  React.useEffect(() => {
    setState(s => s + 1);
  });
  return state;
}
