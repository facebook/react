import React, {Suspense} from 'react';

function Content({data}) {
  return <p dangerouslySetInnerHTML={data.model.content} />;
}

function App({data}) {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <Content data={data} />
    </Suspense>
  );
}

export default App;
