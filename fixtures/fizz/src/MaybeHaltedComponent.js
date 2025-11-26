import {use} from 'react';

export default function MaybeHaltedComponent({promise}) {
  use(promise);
  return <div>Did not halt</div>;
}
