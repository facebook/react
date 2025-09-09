// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({user: {firstName, lastName}}) {
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {firstName: 'John', lastName: 'Doe'}}],
};
