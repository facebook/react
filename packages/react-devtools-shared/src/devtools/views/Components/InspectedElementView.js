/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useCallback, useContext} from 'react';
import {TreeDispatcherContext} from './TreeContext';
import {BridgeContext, StoreContext} from '../context';
import Button from '../Button';
import InspectedElementBadges from './InspectedElementBadges';
import InspectedElementContextTree from './InspectedElementContextTree';
import InspectedElementErrorsAndWarningsTree from './InspectedElementErrorsAndWarningsTree';
import InspectedElementHooksTree from './InspectedElementHooksTree';
import InspectedElementPropsTree from './InspectedElementPropsTree';
import InspectedElementStateTree from './InspectedElementStateTree';
import InspectedElementStyleXPlugin from './InspectedElementStyleXPlugin';
import InspectedElementSuspenseToggle from './InspectedElementSuspenseToggle';
import NativeStyleEditor from './NativeStyleEditor';
import ElementBadges from './ElementBadges';
import {useHighlightHostInstance} from '../hooks';
import {enableStyleXFeatures} from 'react-devtools-feature-flags';
import {logEvent} from 'react-devtools-shared/src/Logger';
import InspectedElementSourcePanel from './InspectedElementSourcePanel';

import styles from './InspectedElementView.css';

import type {
  Element,
  InspectedElement,
} from 'react-devtools-shared/src/frontend/types';
import type {HookNames} from 'react-devtools-shared/src/frontend/types';
import type {ToggleParseHookNames} from './InspectedElementContext';
import type {Source} from 'react-devtools-shared/src/shared/types';

type Props = {
  element: Element,
  hookNames: HookNames | null,
  inspectedElement: InspectedElement,
  parseHookNames: boolean,
  toggleParseHookNames: ToggleParseHookNames,
  symbolicatedSourcePromise: Promise<Source | null>,
};

export default function InspectedElementView({
  element,
  hookNames,
  inspectedElement,
  parseHookNames,
  toggleParseHookNames,
  symbolicatedSourcePromise,
}: Props): React.Node {
  const {owners, rendererPackageName, rendererVersion, rootType, source} =
    inspectedElement;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const rendererLabel =
    rendererPackageName !== null && rendererVersion !== null
      ? `${rendererPackageName}@${rendererVersion}`
      : null;
  const showOwnersList = owners !== null && owners.length > 0;
  const showRenderedBy =
    showOwnersList || rendererLabel !== null || rootType !== null;

  return (
    <Fragment>
      <div className={styles.InspectedElement}>
        <div className={styles.InspectedElementSection}>
          <InspectedElementBadges
            hocDisplayNames={element.hocDisplayNames}
            compiledWithForget={element.compiledWithForget}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <InspectedElementPropsTree
            bridge={bridge}
            element={element}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <InspectedElementSuspenseToggle
            bridge={bridge}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <InspectedElementStateTree
            bridge={bridge}
            element={element}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <InspectedElementHooksTree
            bridge={bridge}
            element={element}
            hookNames={hookNames}
            inspectedElement={inspectedElement}
            parseHookNames={parseHookNames}
            store={store}
            toggleParseHookNames={toggleParseHookNames}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <InspectedElementContextTree
            bridge={bridge}
            element={element}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        {enableStyleXFeatures && (
          <div className={styles.InspectedElementSection}>
            <InspectedElementStyleXPlugin
              bridge={bridge}
              element={element}
              inspectedElement={inspectedElement}
              store={store}
            />
          </div>
        )}

        <div className={styles.InspectedElementSection}>
          <InspectedElementErrorsAndWarningsTree
            bridge={bridge}
            element={element}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        <div className={styles.InspectedElementSection}>
          <NativeStyleEditor />
        </div>

        {showRenderedBy && (
          <div
            className={styles.InspectedElementSection}
            data-testname="InspectedElementView-Owners">
            <div className={styles.OwnersHeader}>rendered by</div>

            {showOwnersList &&
              owners?.map(owner => (
                <OwnerView
                  key={owner.id}
                  displayName={owner.displayName || 'Anonymous'}
                  hocDisplayNames={owner.hocDisplayNames}
                  compiledWithForget={owner.compiledWithForget}
                  id={owner.id}
                  isInStore={store.containsElement(owner.id)}
                  type={owner.type}
                />
              ))}

            {rootType !== null && (
              <div className={styles.OwnersMetaField}>{rootType}</div>
            )}
            {rendererLabel !== null && (
              <div className={styles.OwnersMetaField}>{rendererLabel}</div>
            )}
          </div>
        )}

        {source != null && (
          <div className={styles.InspectedElementSection}>
            <InspectedElementSourcePanel
              source={source}
              symbolicatedSourcePromise={symbolicatedSourcePromise}
            />
          </div>
        )}
      </div>
    </Fragment>
  );
}

type OwnerViewProps = {
  displayName: string,
  hocDisplayNames: Array<string> | null,
  compiledWithForget: boolean,
  id: number,
  isInStore: boolean,
};

function OwnerView({
  displayName,
  hocDisplayNames,
  compiledWithForget,
  id,
  isInStore,
}: OwnerViewProps) {
  const dispatch = useContext(TreeDispatcherContext);
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const handleClick = useCallback(() => {
    logEvent({
      event_name: 'select-element',
      metadata: {source: 'owner-view'},
    });
    dispatch({
      type: 'SELECT_ELEMENT_BY_ID',
      payload: id,
    });
  }, [dispatch, id]);

  return (
    <Button
      key={id}
      className={styles.OwnerButton}
      disabled={!isInStore}
      onClick={handleClick}
      onMouseEnter={() => highlightHostInstance(id)}
      onMouseLeave={clearHighlightHostInstance}>
      <span className={styles.OwnerContent}>
        <span
          className={`${styles.Owner} ${isInStore ? '' : styles.NotInStore}`}
          title={displayName}>
          {displayName}
        </span>

        <ElementBadges
          hocDisplayNames={hocDisplayNames}
          compiledWithForget={compiledWithForget}
        />
      </span>
    </Button>
  );
}
