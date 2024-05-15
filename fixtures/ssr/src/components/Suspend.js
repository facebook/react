let promise = null;
let isResolved = false;

export default function Suspend({children}) {
  // This will suspend the content from rendering but only on the client.
  // This is used to demo a slow loading app.
  if (!isResolved) {
    if (promise === null) {
      promise = new Promise(resolve => {
        setTimeout(
          () => {
            isResolved = true;
            resolve();
          },
          typeof window === 'object' ? 6000 : 1000
        );
      });
    }
    throw promise;
  }
  return children;
}
