/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import {useState, useCallback} from 'react';

export default function useList(initialList = []) {
  const [list, setList] = useState(initialList);

  const remove = useCallback(predicate => {
    setList(prev => prev.filter(item => !predicate(item)));
  }, []);

  const removeAt = useCallback(index => {
    setList(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {list, setList, remove, removeAt};
}
