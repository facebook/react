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
  onBlur: () => void,
  onChange: (index: number) => void,
  onFocus: () => void,
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
      <div
        key={index}
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
            index <= value
              ? styles.SuspenseScrubberBeadSelected
              : styles.SuspenseScrubberBead
          }
        />
      </div>,
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
