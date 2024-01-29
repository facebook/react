/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Element} from 'react-devtools-shared/src/frontend/types';

import * as React from 'react';

import Badge from './Badge';
import ForgetBadge from './ForgetBadge';

import styles from './InspectedElementBadges.css';

type Props = {
  element: Element,
};

export default function InspectedElementBadges({element}: Props): React.Node {
  const {hocDisplayNames, compiledWithForget} = element;

  return (
    <div className={styles.Root}>
      {compiledWithForget && <ForgetBadge indexable={false} />}

      {hocDisplayNames !== null &&
        hocDisplayNames.map(hocDisplayName => (
          <Badge key={hocDisplayName}>{hocDisplayName}</Badge>
        ))}
    </div>
  );
}
