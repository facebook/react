/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import * as React from 'react';
import {useState} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import {serializeDataForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';
import {withPermissionsCheck} from 'react-devtools-shared/src/frontend/utils/withPermissionsCheck';
import StackTraceView from './StackTraceView';
import OwnerView from './OwnerView';
import {meta} from '../../../hydration';

import type {
  InspectedElement,
  SerializedAsyncInfo,
} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type RowProps = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
  asyncInfo: SerializedAsyncInfo,
  index: number,
  minTime: number,
  maxTime: number,
};

function getShortDescription(name: string, description: string): string {
  const descMaxLength = 30 - name.length;
  if (descMaxLength > 1) {
    const l = description.length;
    if (l > 0 && l <= descMaxLength) {
      // We can fit the full description
      return description;
    } else if (
      description.startsWith('http://') ||
      description.startsWith('https://') ||
      description.startsWith('/')
    ) {
      // Looks like a URL. Let's see if we can extract something shorter.
      // We don't have to do a full parse so let's try something cheaper.
      let queryIdx = description.indexOf('?');
      if (queryIdx === -1) {
        queryIdx = description.length;
      }
      if (description.charCodeAt(queryIdx - 1) === 47 /* "/" */) {
        // Ends with slash. Look before that.
        queryIdx--;
      }
      const slashIdx = description.lastIndexOf('/', queryIdx - 1);
      // This may now be either the file name or the host.
      // Include the slash to make it more obvious what we trimmed.
      return '…' + description.slice(slashIdx, queryIdx);
    }
  }
  return '';
}

function SuspendedByRow({
  bridge,
  element,
  inspectedElement,
  store,
  asyncInfo,
  index,
  minTime,
  maxTime,
}: RowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ioInfo = asyncInfo.awaited;
  const name = ioInfo.name;
  const description = ioInfo.description;
  const longName = description === '' ? name : name + ' (' + description + ')';
  const shortDescription = getShortDescription(name, description);
  const start = ioInfo.start;
  const end = ioInfo.end;
  const timeScale = 100 / (maxTime - minTime);
  let left = (start - minTime) * timeScale;
  let width = (end - start) * timeScale;
  if (width < 5) {
    // Use at least a 5% width to avoid showing too small indicators.
    width = 5;
    if (left > 95) {
      left = 95;
    }
  }

  const ioOwner = ioInfo.owner;
  const asyncOwner = asyncInfo.owner;
  const showIOStack = ioInfo.stack !== null && ioInfo.stack.length !== 0;
  // Only show the awaited stack if the I/O started in a different owner
  // than where it was awaited. If it's started by the same component it's
  // probably easy enough to infer and less noise in the common case.
  const showAwaitStack =
    !showIOStack ||
    (ioOwner === null
      ? asyncOwner !== null
      : asyncOwner === null || ioOwner.id !== asyncOwner.id);

  const value: any = ioInfo.value;
  const metaName =
    value !== null && typeof value === 'object' ? value[meta.name] : null;
  const isFulfilled = metaName === 'fulfilled Thenable';
  const isRejected = metaName === 'rejected Thenable';
  return (
    <div className={styles.CollapsableRow}>
      <Button
        className={styles.CollapsableHeader}
        onClick={() => setIsOpen(prevIsOpen => !prevIsOpen)}
        title={longName + ' — ' + (end - start).toFixed(2) + ' ms'}>
        <ButtonIcon
          className={styles.CollapsableHeaderIcon}
          type={isOpen ? 'expanded' : 'collapsed'}
        />
        <span className={styles.CollapsableHeaderTitle}>{name}</span>
        {shortDescription === '' ? null : (
          <>
            <span className={styles.CollapsableHeaderSeparator}>{' ('}</span>
            <span className={styles.CollapsableHeaderTitle}>
              {shortDescription}
            </span>
            <span className={styles.CollapsableHeaderSeparator}>{') '}</span>
          </>
        )}
        <div className={styles.CollapsableHeaderFiller} />
        <div className={styles.TimeBarContainer}>
          <div
            className={
              !isRejected ? styles.TimeBarSpan : styles.TimeBarSpanErrored
            }
            style={{
              left: left.toFixed(2) + '%',
              width: width.toFixed(2) + '%',
            }}
          />
        </div>
      </Button>
      {isOpen && (
        <div className={styles.CollapsableContent}>
          {showIOStack && (
            <StackTraceView
              stack={ioInfo.stack}
              environmentName={
                ioOwner !== null && ioOwner.env === ioInfo.env
                  ? null
                  : ioInfo.env
              }
            />
          )}
          {(showIOStack || !showAwaitStack) &&
          ioOwner !== null &&
          ioOwner.id !== inspectedElement.id ? (
            <OwnerView
              key={ioOwner.id}
              displayName={ioOwner.displayName || 'Anonymous'}
              environmentName={
                ioOwner.env === inspectedElement.env &&
                ioOwner.env === ioInfo.env
                  ? null
                  : ioOwner.env
              }
              hocDisplayNames={ioOwner.hocDisplayNames}
              compiledWithForget={ioOwner.compiledWithForget}
              id={ioOwner.id}
              isInStore={store.containsElement(ioOwner.id)}
              type={ioOwner.type}
            />
          ) : null}
          {showAwaitStack ? (
            <>
              <div className={styles.SmallHeader}>awaited at:</div>
              {asyncInfo.stack !== null && asyncInfo.stack.length > 0 && (
                <StackTraceView
                  stack={asyncInfo.stack}
                  environmentName={
                    asyncOwner !== null && asyncOwner.env === asyncInfo.env
                      ? null
                      : asyncInfo.env
                  }
                />
              )}
              {asyncOwner !== null && asyncOwner.id !== inspectedElement.id ? (
                <OwnerView
                  key={asyncOwner.id}
                  displayName={asyncOwner.displayName || 'Anonymous'}
                  environmentName={
                    asyncOwner.env === inspectedElement.env &&
                    asyncOwner.env === asyncInfo.env
                      ? null
                      : asyncOwner.env
                  }
                  hocDisplayNames={asyncOwner.hocDisplayNames}
                  compiledWithForget={asyncOwner.compiledWithForget}
                  id={asyncOwner.id}
                  isInStore={store.containsElement(asyncOwner.id)}
                  type={asyncOwner.type}
                />
              ) : null}
            </>
          ) : null}
          <div className={styles.PreviewContainer}>
            <KeyValue
              alphaSort={true}
              bridge={bridge}
              canDeletePaths={false}
              canEditValues={false}
              canRenamePaths={false}
              depth={1}
              element={element}
              hidden={false}
              inspectedElement={inspectedElement}
              name={
                isFulfilled
                  ? 'awaited value'
                  : isRejected
                    ? 'rejected with'
                    : 'pending value'
              }
              path={
                isFulfilled
                  ? [index, 'awaited', 'value', 'value']
                  : isRejected
                    ? [index, 'awaited', 'value', 'reason']
                    : [index, 'awaited', 'value']
              }
              pathRoot="suspendedBy"
              store={store}
              value={
                isFulfilled ? value.value : isRejected ? value.reason : value
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
};

function compareTime(a: SerializedAsyncInfo, b: SerializedAsyncInfo): number {
  const ioA = a.awaited;
  const ioB = b.awaited;
  if (ioA.start === ioB.start) {
    return ioA.end - ioB.end;
  }
  return ioA.start - ioB.start;
}

export default function InspectedElementSuspendedBy({
  bridge,
  element,
  inspectedElement,
  store,
}: Props): React.Node {
  const {suspendedBy} = inspectedElement;

  // Skip the section if nothing suspended this component.
  if (suspendedBy == null || suspendedBy.length === 0) {
    return null;
  }

  const handleCopy = withPermissionsCheck(
    {permissions: ['clipboardWrite']},
    () => copy(serializeDataForCopy(suspendedBy)),
  );

  let minTime = Infinity;
  let maxTime = -Infinity;
  for (let i = 0; i < suspendedBy.length; i++) {
    const asyncInfo: SerializedAsyncInfo = suspendedBy[i];
    if (asyncInfo.awaited.start < minTime) {
      minTime = asyncInfo.awaited.start;
    }
    if (asyncInfo.awaited.end > maxTime) {
      maxTime = asyncInfo.awaited.end;
    }
  }

  if (maxTime - minTime < 25) {
    // Stretch the time span a bit to ensure that we don't show
    // large bars that represent very small timespans.
    minTime = maxTime - 25;
  }

  const sortedSuspendedBy = suspendedBy.slice(0);
  sortedSuspendedBy.sort(compareTime);

  return (
    <div>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>suspended by</div>
        <Button onClick={handleCopy} title="Copy to clipboard">
          <ButtonIcon type="copy" />
        </Button>
      </div>
      {sortedSuspendedBy.map((asyncInfo, index) => (
        <SuspendedByRow
          key={index}
          index={index}
          asyncInfo={asyncInfo}
          bridge={bridge}
          element={element}
          inspectedElement={inspectedElement}
          store={store}
          minTime={minTime}
          maxTime={maxTime}
        />
      ))}
    </div>
  );
}
