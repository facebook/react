/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import Badge from './Badge';
import ForgetBadge from './ForgetBadge';

import styles from './InspectedElementBadges.css';

type Props = {
  hocDisplayNames: null | Array<string>,
  compiledWithForget: boolean,
};

export default function InspectedElementBadges({
  hocDisplayNames,
  compiledWithForget,
}: Props): React.Node {
  if (
    !compiledWithForget &&
    (hocDisplayNames == null || hocDisplayNames.length === 0)
  ) {
    return null;
  }

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
