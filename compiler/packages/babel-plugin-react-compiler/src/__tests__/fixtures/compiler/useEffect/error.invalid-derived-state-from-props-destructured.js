// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({props}) {
  const [fullName, setFullName] = useState(props.firstName + ' ' + props.lastName);

  useEffect(() => {
    setFullName(props.firstName + ' ' + props.lastName);
  }, [props.firstName, props.lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstName: 'John', lastName: 'Doe'}],
};
