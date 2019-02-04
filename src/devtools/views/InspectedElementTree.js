// @flow

import React from 'react';
import { meta } from '../../hydration';
import styles from './InspectedElementTree.css';

type Props = {|
  label: string,
  data: Object | null,
|};

export default function InspectedElementTree({ data, label }: Props) {
  if (data === null || Object.keys(data).length === 0) {
    return null;
  } else {
    // TODO Add click and key handlers for toggling element open/close state.
    // TODO Support editable props

    return (
      <div className={styles.InspectedElementTree}>
        <div className={styles.Item}>{label}</div>
        {Object.keys(data).map(name => (
          <KeyValue key={name} depth={1} name={name} value={data[name]} />
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
    children = (
      <div
        key="root"
        className={styles.Item}
        style={{ paddingLeft: `${depth}rem` }}
      >
        <span className={styles.Name}>{name}</span>:{' '}
        <span className={styles.Value}>
          {dataType === 'string' ? `"${value}"` : value}
        </span>
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
          key="root"
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
          key="root"
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

function getMetaValueLabel(data: Object): string | null {
  switch (data[meta.type]) {
    case 'function':
      return `${data[meta.name] || 'fn'}()`;
    case 'object':
      return 'Object';
    case 'date':
    case 'symbol':
      return data[meta.name];
    case 'iterator':
      return `${data[meta.name]}(…)`;
    case 'array_buffer':
    case 'data_view':
    case 'array':
    case 'typed_array':
      return `${data[meta.name]}[${data[meta.meta].length}]`;
    default:
      return null;
  }
}
