/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof {SyntheticEvent} from 'react-dom-bindings/src/events/SyntheticEvent';

import * as React from 'react';
import {useRef} from 'react';

import styles from './SuspenseScrubber.css';

import Tooltip from '../Components/reach-ui/tooltip';

export default function SuspenseScrubber({
  min,
  max,
  value,
  highlight,
  onBlur,
  onChange,
  onFocus,
  onHoverSegment,
  onHoverLeave,
}: {
  min: number,
  max: number,
  value: number,
  highlight: number,
  onBlur?: () => void,
  onChange: (index: number) => void,
  onFocus?: () => void,
  onHoverSegment: (index: number) => void,
  onHoverLeave: () => void,
}): React$Node {
  const inputRef = useRef();
  function handleChange(event: SyntheticEvent) {
    const newValue = +event.currentTarget.value;
    onChange(newValue);
  }
  function handlePress(index: number, event: SyntheticEvent) {
    event.preventDefault();
    if (inputRef.current == null) {
      throw new Error(
        'The input should always be mounted while we can click things.',
      );
    }
    inputRef.current.focus();
    onChange(index);
  }
  const steps = [];
  for (let index = min; index <= max; index++) {
    steps.push(
      <Tooltip
        key={index}
        label={
          index === min
            ? // The first step in the timeline is always a Transition (Initial Paint).
              // TODO: Support multiple environments.
              'Initial Paint'
            : // TODO: Consider adding the name of this specific boundary if this step has only one.
              'Suspense'
        }>
        <div
          className={
            styles.SuspenseScrubberStep +
            (highlight === index
              ? ' ' + styles.SuspenseScrubberStepHighlight
              : '')
          }
          onPointerDown={handlePress.bind(null, index)}
          onMouseEnter={onHoverSegment.bind(null, index)}>
          <div
            className={
              styles.SuspenseScrubberBead +
              (index === min
                ? // The first step in the timeline is always a Transition (Initial Paint).
                  // TODO: Support multiple environments.
                  ' ' + styles.SuspenseScrubberBeadTransition
                : '') +
              (index <= value ? ' ' + styles.SuspenseScrubberBeadSelected : '')
            }
          />
        </div>
      </Tooltip>,
    );
  }

  return (
    <div className={styles.SuspenseScrubber} onMouseLeave={onHoverLeave}>
      <input
        className={styles.SuspenseScrubberInput}
        type="range"
        min={min}
        max={max}
        value={value}
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        ref={inputRef}
      />
      {steps}
    </div>
  );
}
