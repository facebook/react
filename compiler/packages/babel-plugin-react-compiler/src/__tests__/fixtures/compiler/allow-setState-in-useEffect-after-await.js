// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import {useCallback, useEffect, useState} from 'react';

function Component() {
  const [ready, setReady] = useState(false);
  const f = useCallback(async () => {
    await fetch('...');
    setReady(true);
  }, []);

  useEffect(() => {
    f();
  }, [f]);

  return ready;
}
