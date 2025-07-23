import * as React from 'react';

export function Page({slug}) {
  console.log(new Error(slug));

  return <p>{slug}</p>;
}
