// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({prefix}) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(prefix + name);
  }, [prefix, name]);

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <div>{displayName}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prefix: 'Hello, '}],
};
