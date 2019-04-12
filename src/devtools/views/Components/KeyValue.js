// @flow

import React, { useCallback, useState } from 'react';
import type { Element } from 'react';
import EditableValue from './EditableValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import { getMetaValueLabel } from '../utils';
import { meta } from '../../../hydration';
import styles from './KeyValue.css';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type KeyValueProps = {|
  depth: number,
  hidden?: boolean,
  name: string,
  overrideValueFn?: ?OverrideValueFn,
  path?: Array<any>,
  value: any,
|};

export default function KeyValue({
  depth,
  hidden,
  name,
  overrideValueFn,
  path = [],
  value,
}: KeyValueProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleIsOpen = useCallback(
    () => setIsOpen(prevIsOpen => !prevIsOpen),
    []
  );

  const dataType = typeof value;
  const isSimpleType =
    dataType === 'number' ||
    dataType === 'string' ||
    dataType === 'boolean' ||
    value == null;

  const style = {
    paddingLeft: `${(depth - 1) * 0.75}rem`,
  };

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

    const nameClassName =
      typeof overrideValueFn === 'function' ? styles.EditableName : styles.Name;

    children = (
      <div key="root" className={styles.Item} hidden={hidden} style={style}>
        <div className={styles.ExpandCollapseToggleSpacer} />
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
      <div key="root" className={styles.Item} hidden={hidden} style={style}>
        <div className={styles.ExpandCollapseToggleSpacer} />
        <span className={styles.Name}>{name}</span>
        <span className={styles.Value}>{getMetaValueLabel(value)}</span>
      </div>
    );
  } else {
    if (Array.isArray(value)) {
      const hasChildren = value.length > 0;

      children = value.map((innerValue, index) => (
        <KeyValue
          key={index}
          depth={depth + 1}
          hidden={hidden || !isOpen}
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
          hidden={hidden}
          style={style}
        >
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          <span
            className={styles.Name}
            onDoubleClick={hasChildren ? toggleIsOpen : undefined}
          >
            {name}
          </span>
          <span>Array</span>
        </div>
      );
    } else {
      const hasChildren = Object.entries(value).length > 0;

      children = Object.entries(value).map<Element<any>>(([name, value]) => (
        <KeyValue
          key={name}
          depth={depth + 1}
          hidden={hidden || !isOpen}
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
          hidden={hidden}
          style={style}
        >
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          <span
            className={styles.Name}
            onDoubleClick={hasChildren ? toggleIsOpen : undefined}
          >
            {name}
          </span>
          <span>Object</span>
        </div>
      );
    }
  }

  return children;
}
