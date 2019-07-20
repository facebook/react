// @flow

import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import Agent from 'src/backend/agent';
import { hideOverlay, showOverlay } from './Highlighter';

import type { BackendBridge } from 'src/bridge';

export default function setupHighlighter(
  bridge: BackendBridge,
  agent: Agent
): void {
  bridge.addListener(
    'clearNativeElementHighlight',
    clearNativeElementHighlight
  );
  bridge.addListener('highlightNativeElement', highlightNativeElement);
  bridge.addListener('shutdown', stopInspectingNative);
  bridge.addListener('startInspectingNative', startInspectingNative);
  bridge.addListener('stopInspectingNative', stopInspectingNative);

  function startInspectingNative() {
    window.addEventListener('click', onClick, true);
    window.addEventListener('mousedown', onMouseEvent, true);
    window.addEventListener('mouseover', onMouseEvent, true);
    window.addEventListener('mouseup', onMouseEvent, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointerover', onPointerOver, true);
    window.addEventListener('pointerup', onPointerUp, true);
  }

  function stopInspectingNative() {
    hideOverlay();

    window.removeEventListener('click', onClick, true);
    window.removeEventListener('mousedown', onMouseEvent, true);
    window.removeEventListener('mouseover', onMouseEvent, true);
    window.removeEventListener('mouseup', onMouseEvent, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointerover', onPointerOver, true);
    window.removeEventListener('pointerup', onPointerUp, true);
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
  }) {
    const renderer = agent.rendererInterfaces[rendererID];
    if (renderer == null) {
      console.warn(`Invalid renderer id "${rendererID}" for element "${id}"`);
    }

    let nodes: ?Array<HTMLElement> = null;
    if (renderer !== null) {
      nodes = ((renderer.findNativeNodesForFiberID(
        id
      ): any): ?Array<HTMLElement>);
    }

    if (nodes != null && nodes[0] != null) {
      const node = nodes[0];
      if (scrollIntoView && typeof node.scrollIntoView === 'function') {
        // If the node isn't visible show it before highlighting it.
        // We may want to reconsider this; it might be a little disruptive.
        node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      showOverlay(nodes, displayName, hideAfterTimeout);

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

    // Don't pass the name explicitly.
    // It will be inferred from DOM tag and Fiber owner.
    showOverlay([target], null, false);

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
    { leading: false }
  );
}
