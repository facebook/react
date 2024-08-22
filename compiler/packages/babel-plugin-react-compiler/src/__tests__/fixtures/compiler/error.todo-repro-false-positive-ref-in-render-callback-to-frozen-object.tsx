import {createContext, useCallback, useRef} from 'react';

const Context = createContext(null);

function Component({children}) {
  const callbackRef = useRef(function () {});
  const callback = useCallback(() => {
    callbackRef.current();
  }, []);

  const setCallback = useCallback(cb => {
    callbackRef.current = cb;
  }, []);

  return (
    <Context.Provider value={{callback, setCallback}}>
      {children}
    </Context.Provider>
  );
}
