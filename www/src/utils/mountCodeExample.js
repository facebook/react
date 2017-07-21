/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import CodeEditor from '../components/CodeEditor';
import React from 'react';
import ReactDOM from 'react-dom';

// TODO This is a huge hack.
// Remark transform this template to split code examples and their targets apart.
const mountCodeExample = (containerId, code) => {
  const container = document.getElementById(containerId);
  const parent = container.parentElement;

  const children = Array.prototype.filter.call(
    parent.children,
    child => child !== container,
  );
  children.forEach(child => parent.removeChild(child));

  const description = children
    .map(child => child.outerHTML)
    .join('')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  ReactDOM.render(
    <CodeEditor code={code}>
      {<div dangerouslySetInnerHTML={{__html: description}} />}
    </CodeEditor>,
    container,
  );
};

export default mountCodeExample;
