/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useContext, useSyncExternalStore} from 'react';
import {TreeStateContext} from './TreeContext';
import {BridgeContext, StoreContext, OptionsContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Icon from '../Icon';
import Toggle from '../Toggle';
import {ElementTypeSuspense} from 'react-devtools-shared/src/frontend/types';
import InspectedElementView from './InspectedElementView';
import {InspectedElementContext} from './InspectedElementContext';
import {getOpenInEditorURL} from '../../../utils';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../../constants';
import FetchFileWithCachingContext from './FetchFileWithCachingContext';
import {symbolicateSourceWithCache} from 'react-devtools-shared/src/symbolicateSource';
import OpenInEditorButton from './OpenInEditorButton';
import InspectedElementViewSourceButton from './InspectedElementViewSourceButton';
import Skeleton from './Skeleton';

import styles from './InspectedElement.css';

import type {Source} from 'react-devtools-shared/src/shared/types';

export type Props = {};

// TODO Make edits and deletes also use transition API!

export default function InspectedElementWrapper(_: Props): React.Node {
  const {inspectedElementID} = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const {
    hideToggleErrorAction,
    hideToggleSuspenseAction,
    hideLogAction,
    hideViewSourceAction,
  } = useContext(OptionsContext);

  const {hookNames, inspectedElement, parseHookNames, toggleParseHookNames} =
    useContext(InspectedElementContext);

  const fetchFileWithCaching = useContext(FetchFileWithCachingContext);

  const symbolicatedSourcePromise: null | Promise<Source | null> =
    React.useMemo(() => {
      if (inspectedElement == null) return null;
      if (fetchFileWithCaching == null) return Promise.resolve(null);

      const {source} = inspectedElement;
      if (source == null) return Promise.resolve(null);

      const {sourceURL, line, column} = source;
      return symbolicateSourceWithCache(
        fetchFileWithCaching,
        sourceURL,
        line,
        column,
      );
    }, [inspectedElement]);

  const element =
    inspectedElementID !== null
      ? store.getElementByID(inspectedElementID)
      : null;

  const highlightElement = useCallback(() => {
    if (element !== null && inspectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(inspectedElementID);
      if (rendererID !== null) {
        bridge.send('highlightHostInstance', {
          displayName: element.displayName,
          hideAfterTimeout: true,
          id: inspectedElementID,
          openBuiltinElementsPanel: true,
          rendererID,
          scrollIntoView: true,
        });
      }
    }
  }, [bridge, element, inspectedElementID, store]);

  const logElement = useCallback(() => {
    if (inspectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(inspectedElementID);
      if (rendererID !== null) {
        bridge.send('logElementToConsole', {
          id: inspectedElementID,
          rendererID,
        });
      }
    }
  }, [bridge, inspectedElementID, store]);

  const isErrored = inspectedElement != null && inspectedElement.isErrored;

  const isSuspended =
    element !== null &&
    element.type === ElementTypeSuspense &&
    inspectedElement != null &&
    inspectedElement.state != null;

  const canToggleError =
    !hideToggleErrorAction &&
    inspectedElement != null &&
    inspectedElement.canToggleError;

  const canToggleSuspense =
    !hideToggleSuspenseAction &&
    inspectedElement != null &&
    inspectedElement.canToggleSuspense;

  const editorURL = useSyncExternalStore(
    function subscribe(callback) {
      window.addEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      return function unsubscribe() {
        window.removeEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      };
    },
    function getState() {
      return getOpenInEditorURL();
    },
  );

  const toggleErrored = useCallback(() => {
    if (inspectedElement == null) {
      return;
    }

    const rendererID = store.getRendererIDForElement(inspectedElement.id);
    if (rendererID !== null) {
      // Toggle error.
      // Because triggering an error will always delete the children, we'll
      // automatically select the nearest still mounted instance which will be
      // the error boundary.
      bridge.send('overrideError', {
        id: inspectedElement.id,
        rendererID,
        forceError: !isErrored,
      });
    }
  }, [bridge, store, isErrored, inspectedElement]);

  // TODO (suspense toggle) Would be nice to eventually use a two setState pattern here as well.
  const toggleSuspended = useCallback(() => {
    if (inspectedElement == null) {
      return;
    }

    const rendererID = store.getRendererIDForElement(inspectedElement.id);
    if (rendererID !== null) {
      // Toggle suspended
      // Because suspending or unsuspending always delete the children or fallback,
      // we'll automatically select the nearest still mounted instance which will be
      // the Suspense boundary.
      bridge.send('overrideSuspense', {
        id: inspectedElement.id,
        rendererID,
        forceFallback: !isSuspended,
      });
    }
  }, [bridge, store, isSuspended, inspectedElement]);

  if (element === null) {
    return (
      <div className={styles.InspectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  let strictModeBadge = null;
  if (element.isStrictModeNonCompliant) {
    strictModeBadge = (
      <a
        className={styles.StrictModeNonCompliant}
        href="https://react.dev/reference/react/StrictMode"
        rel="noopener noreferrer"
        target="_blank"
        title="This component is not running in StrictMode. Click to learn more.">
        <Icon type="strict-mode-non-compliant" />
      </a>
    );
  }

  return (
    <div className={styles.InspectedElement}>
      <div className={styles.TitleRow} data-testname="InspectedElement-Title">
        {strictModeBadge}

        {element.key && (
          <>
            <div className={styles.Key} title={`key "${element.key}"`}>
              {element.key}
            </div>
            <div className={styles.KeyArrow} />
          </>
        )}

        <div className={styles.SelectedComponentName}>
          <div
            className={
              element.isStrictModeNonCompliant
                ? `${styles.ComponentName} ${styles.StrictModeNonCompliantComponentName}`
                : styles.ComponentName
            }
            title={element.displayName}>
            {element.displayName}
          </div>
        </div>

        {!!editorURL &&
          inspectedElement != null &&
          inspectedElement.source != null &&
          symbolicatedSourcePromise != null && (
            <React.Suspense fallback={<Skeleton height={16} width={24} />}>
              <OpenInEditorButton
                editorURL={editorURL}
                source={inspectedElement.source}
                symbolicatedSourcePromise={symbolicatedSourcePromise}
              />
            </React.Suspense>
          )}

        {canToggleError && (
          <Toggle
            isChecked={isErrored}
            onChange={toggleErrored}
            title={
              isErrored
                ? 'Clear the forced error'
                : 'Force the selected component into an errored state'
            }>
            <ButtonIcon type="error" />
          </Toggle>
        )}
        {canToggleSuspense && (
          <Toggle
            isChecked={isSuspended}
            onChange={toggleSuspended}
            title={
              isSuspended
                ? 'Unsuspend the selected component'
                : 'Suspend the selected component'
            }>
            <ButtonIcon type="suspend" />
          </Toggle>
        )}
        {store.supportsInspectMatchingDOMElement && (
          <Button
            onClick={highlightElement}
            title="Inspect the matching DOM element">
            <ButtonIcon type="view-dom" />
          </Button>
        )}
        {!hideLogAction && (
          <Button
            onClick={logElement}
            title="Log this component data to the console">
            <ButtonIcon type="log-data" />
          </Button>
        )}

        {!hideViewSourceAction && (
          <InspectedElementViewSourceButton
            canViewSource={inspectedElement?.canViewSource}
            source={inspectedElement?.source}
            symbolicatedSourcePromise={symbolicatedSourcePromise}
          />
        )}
      </div>

      {inspectedElement === null && (
        <div className={styles.Loading}>Loading...</div>
      )}

      {inspectedElement !== null && symbolicatedSourcePromise != null && (
        <InspectedElementView
          key={
            inspectedElementID /* Force reset when selected Element changes */
          }
          element={element}
          hookNames={hookNames}
          inspectedElement={inspectedElement}
          parseHookNames={parseHookNames}
          toggleParseHookNames={toggleParseHookNames}
          symbolicatedSourcePromise={symbolicatedSourcePromise}
        />
      )}
    </div>
  );
}
