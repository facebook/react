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

import {
  UNKNOWN_SUSPENDERS_NONE,
  UNKNOWN_SUSPENDERS_REASON_PRODUCTION,
  UNKNOWN_SUSPENDERS_REASON_OLD_VERSION,
  UNKNOWN_SUSPENDERS_REASON_THROWN_PROMISE,
} from '../../../constants';

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

function formatBytes(bytes: number) {
  if (bytes < 1_000) {
    return bytes + ' bytes';
  }
  if (bytes < 1_000_000) {
    return (bytes / 1_000).toFixed(1) + ' kB';
  }
  if (bytes < 1_000_000_000) {
    return (bytes / 1_000_000).toFixed(1) + ' mB';
  }
  return (bytes / 1_000_000_000).toFixed(1) + ' gB';
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
  let name = ioInfo.name;
  if (name === '' || name === 'Promise') {
    // If all we have is a generic name, we can try to infer a better name from
    // the stack. We only do this if the stack has more than one frame since
    // otherwise it's likely to just be the name of the component which isn't better.
    const bestStack = ioInfo.stack || asyncInfo.stack;
    if (bestStack !== null && bestStack.length > 1) {
      // TODO: Ideally we'd get the name from the last ignore listed frame before the
      // first visible frame since this is the same algorithm as the Flight server uses.
      // Ideally, we'd also get the name from the source mapped entry instead of the
      // original entry. However, that would require suspending the immediate display
      // of these rows to first do source mapping before we can show the name.
      name = bestStack[0][0];
    }
  }
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
  const canShowAwaitStack =
    (asyncInfo.stack !== null && asyncInfo.stack.length > 0) ||
    (asyncOwner !== null && asyncOwner.id !== inspectedElement.id);
  const showAwaitStack =
    canShowAwaitStack &&
    (!showIOStack ||
      (ioOwner === null
        ? asyncOwner !== null
        : asyncOwner === null || ioOwner.id !== asyncOwner.id));

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
        title={
          longName +
          ' — ' +
          (end - start).toFixed(2) +
          ' ms' +
          (ioInfo.byteSize != null ? ' — ' + formatBytes(ioInfo.byteSize) : '')
        }>
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
          {ioOwner !== null &&
          ioOwner.id !== inspectedElement.id &&
          (showIOStack ||
            !showAwaitStack ||
            asyncOwner === null ||
            ioOwner.id !== asyncOwner.id) ? (
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
  const {suspendedBy, suspendedByRange} = inspectedElement;

  // Skip the section if nothing suspended this component.
  if (
    (suspendedBy == null || suspendedBy.length === 0) &&
    inspectedElement.unknownSuspenders === UNKNOWN_SUSPENDERS_NONE
  ) {
    return null;
  }

  const handleCopy = withPermissionsCheck(
    {permissions: ['clipboardWrite']},
    () => copy(serializeDataForCopy(suspendedBy)),
  );

  let minTime = Infinity;
  let maxTime = -Infinity;
  if (suspendedByRange !== null) {
    // The range of the whole suspense boundary.
    minTime = suspendedByRange[0];
    maxTime = suspendedByRange[1];
  }
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

  const sortedSuspendedBy = suspendedBy === null ? [] : suspendedBy.slice(0);
  sortedSuspendedBy.sort(compareTime);

  let unknownSuspenders = null;
  switch (inspectedElement.unknownSuspenders) {
    case UNKNOWN_SUSPENDERS_REASON_PRODUCTION:
      unknownSuspenders = (
        <div className={styles.InfoRow}>
          Something suspended but we don't know the exact reason in production
          builds of React. Test this in development mode to see exactly what
          might suspend.
        </div>
      );
      break;
    case UNKNOWN_SUSPENDERS_REASON_OLD_VERSION:
      unknownSuspenders = (
        <div className={styles.InfoRow}>
          Something suspended but we don't track all the necessary information
          in older versions of React. Upgrade to the latest version of React to
          see exactly what might suspend.
        </div>
      );
      break;
    case UNKNOWN_SUSPENDERS_REASON_THROWN_PROMISE:
      unknownSuspenders = (
        <div className={styles.InfoRow}>
          Something threw a Promise to suspend this boundary. It's likely an
          outdated version of a library that doesn't yet fully take advantage of
          use(). Upgrade your data fetching library to see exactly what might
          suspend.
        </div>
      );
      break;
  }

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
      {unknownSuspenders}
    </div>
  );
}
