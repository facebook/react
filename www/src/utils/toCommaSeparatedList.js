/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import React from 'react';

const addString = (list, string) =>
  list.push(<span key={`${list.length}-${string}`}>{string}</span>);

const toCommaSeparatedList = (array, renderCallback) => {
  if (array.length <= 1) {
    return array.map(renderCallback);
  }

  const list = [];

  array.forEach((item, index) => {
    if (index === array.length - 1) {
      addString(list, array.length === 2 ? ' and ' : ', and ');
      list.push(renderCallback(item, index));
    } else if (index > 0) {
      addString(list, ', ');
      list.push(renderCallback(item, index));
    } else {
      list.push(renderCallback(item, index));
    }
  });

  return list;
};

export default toCommaSeparatedList;
