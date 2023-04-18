'use client';

import * as React from 'react';

export default function Form({action, children}) {
  const [isPending, setIsPending] = React.useState(false);

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        setIsPending(true);
        try {
          const formData = new FormData(e.target);
          const result = await action(formData);
          alert(result);
        } catch (error) {
          console.error(error);
        } finally {
          setIsPending(false);
        }
      }}>
      <input name="name" />
      <button>Say Hi</button>
    </form>
  );
}
