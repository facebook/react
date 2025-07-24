import { useEffect, useRef } from 'react';

function App() {
  const ref = useRef<HTMLFormElement | null>(null);

  // Handle form submission using native DOM type
  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLFormElement) {
      console.log('submit action');
      // Manually reset the form
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
        When pressing the reset button or submitting the form, both the React onReset prop and native
        reset event are fired consistently.
      </p>
      <form ref={ref} onReset={(e) => console.log('onReset prop', e)}>
        <input name="name" type="text" />
        <input type="submit" />
        <input type="reset" />
      </form>
    </div>
  );
}

export default App;
