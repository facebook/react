/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {useRouter} from './RouterContext';

export default function Link({to, children, ...rest}) {
  const {navigate} = useRouter();
  return (
    <a
      href={to}
      onClick={e => {
        e.preventDefault();
        window.history.pushState(null, null, to);
        navigate(to);
      }}
      {...rest}>
      {children}
    </a>
  );
}
