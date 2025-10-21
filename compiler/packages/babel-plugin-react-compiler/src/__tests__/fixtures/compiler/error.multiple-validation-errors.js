import {useRef, useState, useEffect} from 'react';

function Component() {
  const ref = useRef();
  const [count, setCount] = useState(0);
  
  // Multiple validation errors:
  const refValue = ref.current; // Error 1: ref access during render
  setCount(count + 1); // Error 2: setState during render
  
  
  useEffect(() => {if (count > 0) {
    useEffect(() => {}); // Error 3: conditional hook
  }
  
    setCount(count + 1); // Error 4: setState in effect
  }, [count]);
  
  return <div>{refValue}</div>;
}