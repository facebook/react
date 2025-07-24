import { useEffect, useRef } from 'react';

function App() {
  const ref = useRef<HTMLFormElement | null>(null);

  // Handle form submission safely with DOM types
  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLFormElement) {
      console.log('submit action');
      e.currentTarget.reset();
    }
  };

  useEffect(() => {
    const form = ref.current;

    const onReset = (e: Event) => {
      console.log('native reset', e);
    };

    if (form) {
      form.addEventListener('reset', onReset);
      form.addEventListener('submit', handleSubmit);

      return () => {
        form.removeEventListener('reset', onReset);
        form.removeEventListener('submit', handleSubmit);
      };
    }
  }, []);

  return (
    <div>
      <p>
        When pressing the reset button or submitting the form, both the custom
        handler and native reset event fire consistently.
      </p>
      <form ref={ref}>
        <input name="name" type="text" />
        <input type="submit" />
        <input type="reset" />
      </form>
    </div>
  );
}

export default App;
