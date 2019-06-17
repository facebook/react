// @flow

import React, { useEffect, useRef, useState } from 'react';
import type { Element } from 'react';
import EditableValue from './EditableValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import { getMetaValueLabel } from '../utils';
import { meta } from '../../../hydration';
import styles from './KeyValue.css';

import type { InspectPath } from './SelectedElement';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type KeyValueProps = {|
  depth: number,
  hidden?: boolean,
  inspectPath?: InspectPath,
  name: string,
  overrideValueFn?: ?OverrideValueFn,
  path: Array<any>,
  value: any,
|};

// TODO (hydration) Don't display meta objects.
// Add event listener to request a "read" instead.

export default function KeyValue({
  depth,
  inspectPath,
  hidden,
  name,
  overrideValueFn,
  path,
  value,
}: KeyValueProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const prevIsOpenRef = useRef(isOpen);

  const isInspectable =
    value !== null &&
    typeof value === 'object' &&
    value[meta.inspectable] &&
    value[meta.size] !== 0;

  useEffect(() => {
    if (
      isInspectable &&
      isOpen &&
      !prevIsOpenRef.current &&
      typeof inspectPath === 'function'
    ) {
      inspectPath(path);
    }
    prevIsOpenRef.current = isOpen;
  }, [inspectPath, isInspectable, isOpen, path]);

  const toggleIsOpen = () => setIsOpen(prevIsOpen => !prevIsOpen);

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
    children = (
      <div key="root" className={styles.Item} hidden={hidden} style={style}>
        {isInspectable ? (
          <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        ) : (
          <div className={styles.ExpandCollapseToggleSpacer} />
        )}
        <span
          className={styles.Name}
          onClick={isInspectable ? toggleIsOpen : undefined}
        >
          {name}
        </span>
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
          inspectPath={inspectPath}
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
            onClick={hasChildren ? toggleIsOpen : undefined}
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
          inspectPath={inspectPath}
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
            onClick={hasChildren ? toggleIsOpen : undefined}
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
