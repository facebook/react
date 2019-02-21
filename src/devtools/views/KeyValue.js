// @flow

import React from 'react';
import EditableValue from './EditableValue';
import { getMetaValueLabel } from './utils';
import { meta } from '../../hydration';
import styles from './KeyValue.css';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type KeyValueProps = {|
  depth: number,
  name: string,
  nameClassName?: string,
  overrideValueFn?: ?OverrideValueFn,
  path?: Array<any>,
  value: any,
|};

export default function KeyValue({
  depth,
  name,
  nameClassName = styles.Name,
  overrideValueFn,
  path = [],
  value,
}: KeyValueProps) {
  const dataType = typeof value;
  const isSimpleType =
    dataType === 'number' ||
    dataType === 'string' ||
    dataType === 'boolean' ||
    value == null;

  const paddingLeft = `${depth * 0.75}rem`;

  let children = null;
  if (isSimpleType) {
    let displayValue = value;
    if (dataType === 'string') {
      displayValue = `"${value}"`;
    } else if (dataType === 'boolean') {
      displayValue = value ? 'true' : 'false';
    } else if (value === null) {
      displayValue = 'null';
    } else if (value === undefined) {
      displayValue = 'undefined';
    }

    children = (
      <div key="root" className={styles.Item} style={{ paddingLeft }}>
        <span className={nameClassName}>{name}</span>
        {typeof overrideValueFn === 'function' ? (
          <EditableValue
            dataType={dataType}
            overrideValueFn={overrideValueFn}
            path={path}
            value={value}
          />
        ) : (
          <span className={styles.Value}>{displayValue}</span>
        )}
      </div>
    );
  } else if (value.hasOwnProperty(meta.type)) {
    // TODO Is this type even necessary? Can we just drop it?
    children = (
      <div key="root" className={styles.Item} style={{ paddingLeft }}>
        <span className={nameClassName}>{name}</span>
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
          overrideValueFn={overrideValueFn}
          path={path.concat(index)}
          value={value[index]}
        />
      ));
      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          style={{ paddingLeft }}
        >
          <span className={nameClassName}>{name}</span>
          <span>Array</span>
        </div>
      );
    } else {
      // $FlowFixMe "Missing type annotation for U" whatever that means
      children = Object.entries(value).map(([name, value]) => (
        <KeyValue
          key={name}
          depth={depth + 1}
          name={name}
          overrideValueFn={overrideValueFn}
          path={path.concat(name)}
          value={value}
        />
      ));
      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          style={{ paddingLeft }}
        >
          <span className={nameClassName}>{name}</span>
          <span>Object</span>
        </div>
      );
    }
  }

  return children;
}
