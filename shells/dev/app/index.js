/** @flow */

import { createElement } from 'react';
import { render } from 'react-dom';
import App from './App';

const container = document.createElement('div');

render(createElement(App), container);

((document.body: any): HTMLBodyElement).appendChild(container);
