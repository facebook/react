import { useEffect, useEffectEvent, useState } from 'react';

function Component() {
  const [, setState] = useState('');

  const onSetState = useEffectEvent(() => {
    setState('test');
  });

  useEffect(() => {
    // Should be an error but isn't
    onSetState();
  }, []);
}