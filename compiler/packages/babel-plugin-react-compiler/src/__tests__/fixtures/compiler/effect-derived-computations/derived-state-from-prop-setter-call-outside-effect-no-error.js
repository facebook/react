// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({initialName}) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <div>
      // 🟡 If the is also called outside of the effect, it's still wrong but
      should be solved by hoisting state
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{initialName: 'John'}],
};
