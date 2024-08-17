import * as React from 'react';
import * as ReactMarkup from 'react-markup';

export default async function Preview() {
  const html = await ReactMarkup.experimental_renderToHTML(
    <div>Hello, Dave!</div>
  );

  return (
    <>
      <h2>Preview</h2>
      <pre>{html}</pre>
    </>
  );
}
