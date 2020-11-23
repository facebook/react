import * as React from 'react';
import {RefreshContext} from './Context.client';

export default function DeleteTodo({id}) {
  const [startTransition] = React.unstable_useTransition();
  const refresh = React.useContext(RefreshContext);

  return (
    <button
      onClick={async () => {
        await fetch('http://localhost:3001/todos/' + id, {
          method: 'DELETE',
          mode: 'cors',
        });
        startTransition(() => {
          refresh();
        });
      }}>
      x
    </button>
  );
}
