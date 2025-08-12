/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext} from 'react';
import {BridgeContext, StoreContext} from '../context';
import InspectedElementBadges from './InspectedElementBadges';
import InspectedElementContextTree from './InspectedElementContextTree';
import InspectedElementErrorsAndWarningsTree from './InspectedElementErrorsAndWarningsTree';
import InspectedElementHooksTree from './InspectedElementHooksTree';
import InspectedElementPropsTree from './InspectedElementPropsTree';
import InspectedElementStateTree from './InspectedElementStateTree';
import InspectedElementStyleXPlugin from './InspectedElementStyleXPlugin';
import InspectedElementSuspenseToggle from './InspectedElementSuspenseToggle';
import InspectedElementSuspendedBy from './InspectedElementSuspendedBy';
import NativeStyleEditor from './NativeStyleEditor';
import {enableStyleXFeatures} from 'react-devtools-feature-flags';
import InspectedElementSourcePanel from './InspectedElementSourcePanel';
import StackTraceView from './StackTraceView';
import OwnerView from './OwnerView';
import Skeleton from './Skeleton';

import styles from './InspectedElementView.css';

import type {
  Element,
  InspectedElement,
} from 'react-devtools-shared/src/frontend/types';
import type {HookNames} from 'react-devtools-shared/src/frontend/types';
import type {ToggleParseHookNames} from './InspectedElementContext';
import type {ReactFunctionLocation} from 'shared/ReactTypes';

type Props = {
  element: Element,
  hookNames: HookNames | null,
  inspectedElement: InspectedElement,
  parseHookNames: boolean,
  toggleParseHookNames: ToggleParseHookNames,
  symbolicatedSourcePromise: Promise<ReactFunctionLocation | null>,
};

export default function InspectedElementView({
  element,
  hookNames,
  inspectedElement,
  parseHookNames,
  toggleParseHookNames,
  symbolicatedSourcePromise,
}: Props): React.Node {
  const {
    stack,
    owners,
    rendererPackageName,
    rendererVersion,
    rootType,
    source,
    nativeTag,
  } = inspectedElement;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const rendererLabel =
    rendererPackageName !== null && rendererVersion !== null
      ? `${rendererPackageName}@${rendererVersion}`
      : null;
  const showOwnersList = owners !== null && owners.length > 0;
  const showStack = stack != null && stack.length > 0;
  const showRenderedBy =
    showStack || showOwnersList || rendererLabel !== null || rootType !== null;

  return (
    <Fragment>
      <div className={styles.InspectedElement}>
        <div className={styles.InspectedElementSection}>
          <InspectedElementBadges
            hocDisplayNames={element.hocDisplayNames}
            compiledWithForget={element.compiledWithForget}
            nativeTag={nativeTag}
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

        <div className={styles.InspectedElementSection}>
          <InspectedElementSuspendedBy
            bridge={bridge}
            element={element}
            inspectedElement={inspectedElement}
            store={store}
          />
        </div>

        {showRenderedBy && (
          <div
            className={styles.InspectedElementSection}
            data-testname="InspectedElementView-Owners">
            <div className={styles.OwnersHeader}>rendered by</div>
            <React.Suspense
              fallback={
                <div className={styles.RenderedBySkeleton}>
                  <Skeleton height={16} width="40%" />
                </div>
              }>
              {showStack ? <StackTraceView stack={stack} /> : null}
              {showOwnersList &&
                owners?.map(owner => (
                  <Fragment key={owner.id}>
                    <OwnerView
                      displayName={owner.displayName || 'Anonymous'}
                      hocDisplayNames={owner.hocDisplayNames}
                      environmentName={
                        inspectedElement.env === owner.env ? null : owner.env
                      }
                      compiledWithForget={owner.compiledWithForget}
                      id={owner.id}
                      isInStore={store.containsElement(owner.id)}
                      type={owner.type}
                    />
                    {owner.stack != null && owner.stack.length > 0 ? (
                      <StackTraceView stack={owner.stack} />
                    ) : null}
                  </Fragment>
                ))}

              {rootType !== null && (
                <div className={styles.OwnersMetaField}>{rootType}</div>
              )}
              {rendererLabel !== null && (
                <div className={styles.OwnersMetaField}>{rendererLabel}</div>
              )}
            </React.Suspense>
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
