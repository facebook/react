/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useState} from 'react';

import ButtonIcon from '../ButtonIcon';

import styles from './StickyCollapsibleHeader.css';

type Props = {
  summary: React.Node,
  children: React.Node,
};

export default function StickyCollapsibleHeader({
  summary,
  children,
}: Props): React.Node {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsedVal = () =>
    setIsCollapsed(prevIsCollapsed => !prevIsCollapsed);

  // $FlowFixMe[missing-local-annot]
  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Prevent the browser from scrolling down when Space is pressed
      if (event.key === ' ') {
        event.preventDefault();
      }
      toggleCollapsedVal();
    }
  };

  return (
    <div className={styles.StickyHeader}>
      <div
        className={styles.HeaderRow}
        onClick={toggleCollapsedVal}
        tabIndex={0}
        role="button"
        aria-expanded={!isCollapsed}
        onKeyDown={handleKeyDown}>
        <div className={styles.RenderSummary}>{summary}</div>

        <div className={styles.HeaderRowControls}>
          <ButtonIcon type={isCollapsed ? 'expanded' : 'collapsed'} />
        </div>
      </div>

      {!isCollapsed && (
        <div className={styles.CollapsibleContent}>{children}</div>
      )}
    </div>
  );
}
