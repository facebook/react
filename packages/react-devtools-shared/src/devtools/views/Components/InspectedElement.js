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
import {getAlwaysOpenInEditor} from '../../../utils';
import {LOCAL_STORAGE_ALWAYS_OPEN_IN_EDITOR} from '../../../constants';
import FetchFileWithCachingContext from './FetchFileWithCachingContext';
import {symbolicateSourceWithCache} from 'react-devtools-shared/src/symbolicateSource';
import OpenInEditorButton from './OpenInEditorButton';
import InspectedElementViewSourceButton from './InspectedElementViewSourceButton';
import useEditorURL from '../useEditorURL';

import styles from './InspectedElement.css';

import type {ReactFunctionLocation} from 'shared/ReactTypes';

export type Props = {};

// TODO Make edits and deletes also use transition API!

const noSourcePromise = Promise.resolve(null);

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

  const source =
    inspectedElement == null
      ? null
      : inspectedElement.source != null
        ? inspectedElement.source
        : inspectedElement.stack != null && inspectedElement.stack.length > 0
          ? inspectedElement.stack[0]
          : null;

  const symbolicatedSourcePromise: Promise<ReactFunctionLocation | null> =
    React.useMemo(() => {
      if (fetchFileWithCaching == null) return noSourcePromise;

      if (source == null) return noSourcePromise;

      const [, sourceURL, line, column] = source;
      return symbolicateSourceWithCache(
        fetchFileWithCaching,
        sourceURL,
        line,
        column,
      );
    }, [source]);

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
    inspectedElement.isSuspended;

  const canToggleError =
    !hideToggleErrorAction &&
    inspectedElement != null &&
    inspectedElement.canToggleError;

  const canToggleSuspense =
    !hideToggleSuspenseAction &&
    inspectedElement != null &&
    inspectedElement.canToggleSuspense;

  const alwaysOpenInEditor = useSyncExternalStore(
    useCallback(function subscribe(callback) {
      window.addEventListener(LOCAL_STORAGE_ALWAYS_OPEN_IN_EDITOR, callback);
      return function unsubscribe() {
        window.removeEventListener(
          LOCAL_STORAGE_ALWAYS_OPEN_IN_EDITOR,
          callback,
        );
      };
    }, []),
    getAlwaysOpenInEditor,
  );

  const editorURL = useEditorURL();

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
    <div
      className={styles.InspectedElement}
      key={inspectedElementID /* Force reset when selected Element changes */}>
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

        {!alwaysOpenInEditor &&
          !!editorURL &&
          source != null &&
          symbolicatedSourcePromise != null && (
            <OpenInEditorButton
              editorURL={editorURL}
              source={source}
              symbolicatedSourcePromise={symbolicatedSourcePromise}
            />
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
            source={source}
            symbolicatedSourcePromise={symbolicatedSourcePromise}
          />
        )}
      </div>

      {inspectedElement === null && (
        <div className={styles.Loading}>Loading...</div>
      )}

      {inspectedElement !== null && (
        <InspectedElementView
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
