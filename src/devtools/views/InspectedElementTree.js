// @flow

import React from 'react';
import { getMetaValueLabel } from './utils';
import { meta } from '../../hydration';
import styles from './InspectedElementTree.css';

type Props = {|
  data: Object | null,
  label: string,
  showWhenEmpty?: boolean,
|};

export default function InspectedElementTree({
  data,
  label,
  showWhenEmpty = false,
}: Props) {
  const isEmpty = data === null || Object.keys(data).length === 0;

  if (isEmpty && !showWhenEmpty) {
    return null;
  } else {
    // TODO Add click and key handlers for toggling element open/close state.
    // TODO Support editable props
    return (
      <div className={styles.InspectedElementTree}>
        <div className={styles.Item}>{label}</div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          Object.keys((data: any)).map(name => (
            <KeyValue
              key={name}
              depth={1}
              name={name}
              value={(data: any)[name]}
            />
          ))}
      </div>
    );
  }
}

type KeyValueProps = {|
  depth: number,
  name: string,
  value: any,
|};

function KeyValue({ depth, name, value }: KeyValueProps) {
  const dataType = typeof value;
  const isSimpleType =
    dataType === 'number' ||
    dataType === 'string' ||
    dataType === 'boolean' ||
    value == null;

  let children = null;
  if (isSimpleType) {
    let displayValue = value;
    if (dataType === 'string') {
      displayValue = `"${value}"`;
    } else if (dataType === 'boolean') {
      displayValue = value ? 'true' : 'false';
    }

    children = (
      <div
        key="root"
        className={styles.Item}
        style={{ paddingLeft: `${depth}rem` }}
      >
        <span className={styles.Name}>{name}</span>:{' '}
        <span className={styles.Value}>{displayValue}</span>
      </div>
    );
  } else if (value.hasOwnProperty(meta.type)) {
    children = (
      <div
        key="root"
        className={styles.Item}
        style={{ paddingLeft: `${depth}rem` }}
      >
        <span className={styles.Name}>{name}</span>:{' '}
        <span className={styles.Value}>{getMetaValueLabel(value)}</span>
      </div>
    );
  } else {
    if (Array.isArray(value)) {
      children = value.map((innerValue, index) => (
        <KeyValue
          key={index}
          depth={depth + 1}
          name={index}
          value={value[index]}
        />
      ));
      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          style={{ paddingLeft: `${depth}rem` }}
        >
          <span className={styles.Name}>{name}</span>: <span>Array</span>
        </div>
      );
    } else {
      children = Object.entries(value).map(([name, value]) => (
        <KeyValue key={name} depth={depth + 1} name={name} value={value} />
      ));
      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          style={{ paddingLeft: `${depth}rem` }}
        >
          <span className={styles.Name}>{name}</span>: <span>Object</span>
        </div>
      );
    }
  }

  return children;
}
