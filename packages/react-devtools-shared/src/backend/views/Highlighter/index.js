/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Agent from 'react-devtools-shared/src/backend/agent';
import {hideOverlay, showOverlay} from './Highlighter';

import type {BackendBridge} from 'react-devtools-shared/src/bridge';

// This plug-in provides in-page highlighting of the selected element.
// It is used by the browser extension and the standalone DevTools shell (when connected to a browser).
// It is not currently the mechanism used to highlight React Native views.
// That is done by the React Native Inspector component.

let iframesListeningTo: Set<HTMLIFrameElement> = new Set();

export default function setupHighlighter(
  bridge: BackendBridge,
  agent: Agent,
): void {
  bridge.addListener('clearHostInstanceHighlight', clearHostInstanceHighlight);
  bridge.addListener('highlightHostInstance', highlightHostInstance);
  bridge.addListener('shutdown', stopInspectingHost);
  bridge.addListener('startInspectingHost', startInspectingHost);
  bridge.addListener('stopInspectingHost', stopInspectingHost);

  function startInspectingHost() {
    registerListenersOnWindow(window);
  }

  function registerListenersOnWindow(window: any) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    if (window && typeof window.addEventListener === 'function') {
      window.addEventListener('click', onClick, true);
      window.addEventListener('mousedown', onMouseEvent, true);
      window.addEventListener('mouseover', onMouseEvent, true);
      window.addEventListener('mouseup', onMouseEvent, true);
      window.addEventListener('pointerdown', onPointerDown, true);
      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('pointerup', onPointerUp, true);
    } else {
      agent.emit('startInspectingNative');
    }
  }

  function stopInspectingHost() {
    hideOverlay(agent);
    removeListenersOnWindow(window);
    iframesListeningTo.forEach(function (frame) {
      try {
        removeListenersOnWindow(frame.contentWindow);
      } catch (error) {
        // This can error when the iframe is on a cross-origin.
      }
    });
    iframesListeningTo = new Set();
  }

  function removeListenersOnWindow(window: any) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    if (window && typeof window.removeEventListener === 'function') {
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('mousedown', onMouseEvent, true);
      window.removeEventListener('mouseover', onMouseEvent, true);
      window.removeEventListener('mouseup', onMouseEvent, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
    } else {
      agent.emit('stopInspectingNative');
    }
  }

  function clearHostInstanceHighlight() {
    hideOverlay(agent);
  }

  function highlightHostInstance({
    displayName,
    hideAfterTimeout,
    id,
    openBuiltinElementsPanel,
    rendererID,
    scrollIntoView,
  }: {
    displayName: string | null,
    hideAfterTimeout: boolean,
    id: number,
    openBuiltinElementsPanel: boolean,
    rendererID: number,
    scrollIntoView: boolean,
    ...
  }) {
    const renderer = agent.rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);

      hideOverlay(agent);
      return;
    }

    // In some cases fiber may already be unmounted
    if (!renderer.hasElementWithId(id)) {
      hideOverlay(agent);
      return;
    }

    const nodes = renderer.findHostInstancesForElementID(id);

    if (nodes != null && nodes[0] != null) {
      const node = nodes[0];
      // $FlowFixMe[method-unbinding]
      if (scrollIntoView && typeof node.scrollIntoView === 'function') {
        // If the node isn't visible show it before highlighting it.
        // We may want to reconsider this; it might be a little disruptive.
        node.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }

      showOverlay(nodes, displayName, agent, hideAfterTimeout);

      if (openBuiltinElementsPanel) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = node;
        bridge.send('syncSelectionToBuiltinElementsPanel');
      }
    } else {
      hideOverlay(agent);
    }
  }

  function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    stopInspectingHost();

    bridge.send('stopInspectingHost', true);
  }

  function onMouseEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onPointerDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    selectElementForNode(getEventTarget(event));
  }

  let lastHoveredNode: HTMLElement | null = null;
  function onPointerMove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const target: HTMLElement = getEventTarget(event);
    if (lastHoveredNode === target) return;
    lastHoveredNode = target;

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

    selectElementForNode(target);
  }

  function onPointerUp(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  const selectElementForNode = (node: HTMLElement) => {
    const id = agent.getIDForHostInstance(node);
    if (id !== null) {
      bridge.send('selectElement', id);
    }
  };

  function getEventTarget(event: MouseEvent): HTMLElement {
    if (event.composed) {
      return (event.composedPath()[0]: any);
    }

    return (event.target: any);
  }
}
