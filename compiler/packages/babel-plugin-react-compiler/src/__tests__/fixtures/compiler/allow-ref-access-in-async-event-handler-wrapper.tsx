// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates react-hook-form's handleSubmit
function handleSubmit<T>(callback: (data: T) => void | Promise<void>) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

// Simulates an upload function
async function upload(file: any): Promise<{blob: {url: string}}> {
  return {blob: {url: 'https://example.com/file.jpg'}};
}

interface SignatureRef {
  toFile(): any;
}

function Component() {
  const ref = useRef<SignatureRef>(null);

  const onSubmit = async (value: any) => {
    // This should be allowed: accessing ref.current in an async event handler
    // that's wrapped and passed to onSubmit prop
    let sigUrl: string;
    if (value.hasSignature) {
      const {blob} = await upload(ref.current?.toFile());
      sigUrl = blob?.url || '';
    } else {
      sigUrl = value.signature;
    }
    console.log('Signature URL:', sigUrl);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" name="signature" />
      <button type="submit">Submit</button>
    </form>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
