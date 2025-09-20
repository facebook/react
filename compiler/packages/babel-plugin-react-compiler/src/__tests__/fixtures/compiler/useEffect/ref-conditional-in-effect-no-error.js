// @validateNoDerivedComputationsInEffects
import {useEffect, useState, useRef} from 'react';

export default function Component({test}) {
  const [local, setLocal] = useState('');

  const myRef = useRef(null);

  useEffect(() => {
    if (myRef.current) {
      setLocal(test + 'Available');
    } else {
      setLocal(test + 'NotAvailable');
    }
  }, [test]);

  return <>{local}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: 'testString'}],
};
