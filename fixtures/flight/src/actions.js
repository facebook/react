'use server';

import * as React from 'react';
import {setServerState} from './ServerState.js';
import Deduped from './Deduped.js';

export async function like() {
  setServerState('Liked!');
  return new Promise((resolve, reject) => resolve('Liked'));
}

export async function greet(formData) {
  const name = formData.get('name') || 'you';
  setServerState('Hi ' + name);
  const file = formData.get('file');
  if (file) {
    return `Ok, ${name}, here is ${file.name}:
      ${(await file.text()).toUpperCase()}
    `;
  }
  return 'Hi ' + name + '!';
}

export async function increment(n) {
  return n + 1;
}

export async function returnElement(prevElement) {
  const text = <div>Hello</div>;

  return (
    <Deduped thing={text}>
      {prevElement}
      {text}
    </Deduped>
  );
}
