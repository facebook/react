/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {RegistryContext} from './Contexts';

import styles from './ContextMenu.css';

import type {RegistryContextType} from './Contexts';

function repositionToFit(element: HTMLElement, pageX: number, pageY: number) {
  const ownerWindow = element.ownerDocument.defaultView;
  if (element !== null) {
    if (pageY + element.offsetHeight >= ownerWindow.innerHeight) {
      if (pageY - element.offsetHeight > 0) {
        element.style.top = `${pageY - element.offsetHeight}px`;
      } else {
        element.style.top = '0px';
      }
    } else {
      element.style.top = `${pageY}px`;
    }

    if (pageX + element.offsetWidth >= ownerWindow.innerWidth) {
      if (pageX - element.offsetWidth > 0) {
        element.style.left = `${pageX - element.offsetWidth}px`;
      } else {
        element.style.left = '0px';
      }
    } else {
      element.style.left = `${pageX}px`;
    }
  }
}

const HIDDEN_STATE = {
  data: null,
  isVisible: false,
  pageX: 0,
  pageY: 0,
};

type Props = {|
  children: (data: Object) => React$Node,
  id: string,
|};

export default function ContextMenu({children, id}: Props) {
  const {registerMenu} = useContext<RegistryContextType>(RegistryContext);

  const [state, setState] = useState(HIDDEN_STATE);

  const bodyAccessorRef = useRef(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const element = bodyAccessorRef.current;
    if (element !== null) {
      const ownerDocument = element.ownerDocument;
      containerRef.current = ownerDocument.createElement('div');
      ownerDocument.body.appendChild(containerRef.current);
      return () => {
        ownerDocument.body.removeChild(containerRef.current);
      };
    }
  }, []);

  useEffect(() => {
    const showMenu = ({data, pageX, pageY}) => {
      setState({data, isVisible: true, pageX, pageY});
    };
    const hideMenu = () => setState(HIDDEN_STATE);
    return registerMenu(id, showMenu, hideMenu);
  }, [id]);

  useLayoutEffect(() => {
    if (!state.isVisible) {
      return;
    }

    const menu = ((menuRef.current: any): HTMLElement);
    const container = containerRef.current;
    if (container !== null) {
      const hideUnlessContains = event => {
        if (!menu.contains(event.target)) {
          setState(HIDDEN_STATE);
        }
      };

      const hide = event => {
        setState(HIDDEN_STATE);
      };

      const ownerDocument = container.ownerDocument;
      ownerDocument.addEventListener('mousedown', hideUnlessContains);
      ownerDocument.addEventListener('touchstart', hideUnlessContains);
      ownerDocument.addEventListener('keydown', hideUnlessContains);

      const ownerWindow = ownerDocument.defaultView;
      ownerWindow.addEventListener('resize', hide);

      repositionToFit(menu, state.pageX, state.pageY);

      return () => {
        ownerDocument.removeEventListener('mousedown', hideUnlessContains);
        ownerDocument.removeEventListener('touchstart', hideUnlessContains);
        ownerDocument.removeEventListener('keydown', hideUnlessContains);

        ownerWindow.removeEventListener('resize', hide);
      };
    }
  }, [state]);

  if (!state.isVisible) {
    return <div ref={bodyAccessorRef} />;
  } else {
    const container = containerRef.current;
    if (container !== null) {
      return createPortal(
        <div ref={menuRef} className={styles.ContextMenu}>
          {children(state.data)}
        </div>,
        container,
      );
    } else {
      return null;
    }
  }
}
