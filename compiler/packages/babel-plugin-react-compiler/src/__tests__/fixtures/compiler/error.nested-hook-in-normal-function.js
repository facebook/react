// @validateNoComponentOrHookFactories
import {useState} from 'react';

function createCustomHook(config) {
  function useConfiguredState() {
    const [state, setState] = useState(0);

    const increment = () => {
      setState(state + config.step);
    };

    return [state, increment];
  }

  return useConfiguredState;
}