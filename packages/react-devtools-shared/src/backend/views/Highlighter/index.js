/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import Agent from 'react-devtools-shared/src/backend/agent';
import {hideOverlay, showOverlay} from './Highlighter';

import type {BackendBridge} from 'react-devtools-shared/src/bridge';
import type {_Window} from 'react-devtools-shared/src/backend/types';

// This plug-in provides in-page highlighting of the selected element.
// It is used by the browser extension and the standalone DevTools shell (when connected to a browser).
// It is not currently the mechanism used to highlight React Native views.
// That is done by the React Native Inspector component.

let iframesListeningTo: Set<HTMLIFrameElement> = new Set();

export default function setupHighlighter(
  bridge: BackendBridge,
  agent: Agent,
  _window?: _Window,
): void {
  bridge.addListener(
    'clearNativeElementHighlight',
    clearNativeElementHighlight,
  );
  bridge.addListener('highlightNativeElement', highlightNativeElement);
  bridge.addListener('shutdown', stopInspectingNative);
  bridge.addListener('startInspectingNative', startInspectingNative);
  bridge.addListener('stopInspectingNative', stopInspectingNative);

  function startInspectingNative() {
    registerListenersOnWindow(window);
  }

  function registerListenersOnWindow(window) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    let addEventListener = null;
    if (_window) {
      addEventListener = _window.addEventListener;
    } else if (window && typeof window.addEventListener === 'function') {
      addEventListener = window.addEventListener;
    }

    if (addEventListener !== null) {
      addEventListener('click', onClick, true);
      addEventListener('mousedown', onMouseEvent, true);
      addEventListener('mouseover', onMouseEvent, true);
      addEventListener('mouseup', onMouseEvent, true);
      addEventListener('pointerdown', onPointerDown, true);
      addEventListener('pointerover', onPointerOver, true);
      addEventListener('pointerup', onPointerUp, true);
    }
  }

  function stopInspectingNative() {
    hideOverlay();
    removeListenersOnWindow(window);
    iframesListeningTo.forEach(function(frame) {
      try {
        removeListenersOnWindow(frame.contentWindow);
      } catch (error) {
        // This can error when the iframe is on a cross-origin.
      }
    });
    iframesListeningTo = new Set();
  }

  function removeListenersOnWindow(window) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    let removeEventListener = null;
    if (_window) {
      removeEventListener = _window.removeEventListener;
    } else if (window && typeof window.removeEventListener === 'function') {
      removeEventListener = window.removeEventListener;
    }

    if (removeEventListener !== null) {
      removeEventListener('click', onClick, true);
      removeEventListener('mousedown', onMouseEvent, true);
      removeEventListener('mouseover', onMouseEvent, true);
      removeEventListener('mouseup', onMouseEvent, true);
      removeEventListener('pointerdown', onPointerDown, true);
      removeEventListener('pointerover', onPointerOver, true);
      removeEventListener('pointerup', onPointerUp, true);
    }
  }

  function clearNativeElementHighlight() {
    hideOverlay();
  }

  function highlightNativeElement({
    displayName,
    hideAfterTimeout,
    id,
    openNativeElementsPanel,
    rendererID,
    scrollIntoView,
  }: {
    displayName: string | null,
    hideAfterTimeout: boolean,
    id: number,
    openNativeElementsPanel: boolean,
    rendererID: number,
    scrollIntoView: boolean,
    ...
  }) {
    const renderer = agent.rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }

    let nodes: ?Array<HTMLElement> = null;
    if (renderer != null) {
      nodes = ((renderer.findNativeNodesForFiberID(
        id,
      ): any): ?Array<HTMLElement>);
    }

    if (nodes != null && nodes[0] != null) {
      const node = nodes[0];
      if (scrollIntoView && typeof node.scrollIntoView === 'function') {
        // If the node isn't visible show it before highlighting it.
        // We may want to reconsider this; it might be a little disruptive.
        // $FlowFixMe Flow only knows about 'start' | 'end'
        node.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }

      showOverlay(nodes, displayName, agent, hideAfterTimeout);

      if (openNativeElementsPanel) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = node;
        bridge.send('syncSelectionToNativeElementsPanel');
      }
    } else {
      hideOverlay();
    }
  }

  function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    stopInspectingNative();

    bridge.send('stopInspectingNative', true);
  }

  function onMouseEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onPointerDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    selectFiberForNode(((event.target: any): HTMLElement));
  }

  function onPointerOver(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const target = ((event.target: any): HTMLElement);

    if (target.tagName === 'IFRAME') {
      const iframe: HTMLIFrameElement = (target: any);
      try {
        if (!iframesListeningTo.has(iframe)) {
          const window = iframe.contentWindow;
          registerListenersOnWindow(window);
          iframesListeningTo.add(iframe);
        }
      } catch (error) {
        // This can error when the iframe is on a cross-origin.
      }
    }

    // Don't pass the name explicitly.
    // It will be inferred from DOM tag and Fiber owner.
    showOverlay([target], null, agent, false);

    selectFiberForNode(target);
  }

  function onPointerUp(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  const selectFiberForNode = throttle(
    memoize((node: HTMLElement) => {
      const id = agent.getIDForNode(node);
      if (id !== null) {
        bridge.send('selectFiber', id);
      }
    }),
    200,
    // Don't change the selection in the very first 200ms
    // because those are usually unintentional as you lift the cursor.
    {leading: false},
  );
}
