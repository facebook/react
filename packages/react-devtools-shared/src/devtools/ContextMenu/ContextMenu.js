/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useLayoutEffect, createRef} from 'react';
import {createPortal} from 'react-dom';

import ContextMenuItem from './ContextMenuItem';

import type {
  ContextMenuItem as ContextMenuItemType,
  ContextMenuPosition,
  ContextMenuRef,
} from './types';

import styles from './ContextMenu.css';

function repositionToFit(element: HTMLElement, x: number, y: number) {
  const ownerWindow = element.ownerDocument.defaultView;
  if (y + element.offsetHeight >= ownerWindow.innerHeight) {
    if (y - element.offsetHeight > 0) {
      element.style.top = `${y - element.offsetHeight}px`;
    } else {
      element.style.top = '0px';
    }
  } else {
    element.style.top = `${y}px`;
  }

  if (x + element.offsetWidth >= ownerWindow.innerWidth) {
    if (x - element.offsetWidth > 0) {
      element.style.left = `${x - element.offsetWidth}px`;
    } else {
      element.style.left = '0px';
    }
  } else {
    element.style.left = `${x}px`;
  }
}

type Props = {
  anchorElementRef: {current: React.ElementRef<any> | null},
  items: ContextMenuItemType[],
  position: ContextMenuPosition,
  hide: () => void,
  ref?: ContextMenuRef,
};

export default function ContextMenu({
  anchorElementRef,
  position,
  items,
  hide,
  ref = createRef(),
}: Props): React.Node {
  // This works on the assumption that ContextMenu component is only rendered when it should be shown
  const anchor = anchorElementRef.current;

  if (anchor == null) {
    throw new Error(
      'Attempted to open a context menu for an element, which is not mounted',
    );
  }

  const ownerDocument = anchor.ownerDocument;
  const portalContainer = ownerDocument.querySelector(
    '[data-react-devtools-portal-root]',
  );

  useLayoutEffect(() => {
    const menu = ((ref.current: any): HTMLElement);

    function hideUnlessContains(event: Event) {
      if (!menu.contains(((event.target: any): Node))) {
        hide();
      }
    }

    ownerDocument.addEventListener('mousedown', hideUnlessContains);
    ownerDocument.addEventListener('touchstart', hideUnlessContains);
    ownerDocument.addEventListener('keydown', hideUnlessContains);

    const ownerWindow = ownerDocument.defaultView;
    ownerWindow.addEventListener('resize', hide);

    repositionToFit(menu, position.x, position.y);

    return () => {
      ownerDocument.removeEventListener('mousedown', hideUnlessContains);
      ownerDocument.removeEventListener('touchstart', hideUnlessContains);
      ownerDocument.removeEventListener('keydown', hideUnlessContains);

      ownerWindow.removeEventListener('resize', hide);
    };
  }, []);

  if (portalContainer == null || items.length === 0) {
    return null;
  }

  return createPortal(
    <div className={styles.ContextMenu} ref={ref}>
      {items.map(({onClick, content}, index) => (
        <ContextMenuItem key={index} onClick={onClick} hide={hide}>
          {content}
        </ContextMenuItem>
      ))}
    </div>,
    portalContainer,
  );
}
