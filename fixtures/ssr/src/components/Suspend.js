let promise = null;
let isResolved = false;

export default function Suspend({children}) {
  // This will suspend the content from rendering but only on the client.
  // This is used to demo a slow loading app.
  if (typeof window === 'object') {
    if (!isResolved) {
      if (promise === null) {
        promise = new Promise(resolve => {
          setTimeout(() => {
            isResolved = true;
            resolve();
          }, 6000);
        });
      }
      throw promise;
    }
  }
  return children;
}
