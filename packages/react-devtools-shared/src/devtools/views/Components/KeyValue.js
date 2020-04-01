/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import EditableValue from './EditableValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import {alphaSortEntries, getMetaValueLabel} from '../utils';
import {meta} from '../../../hydration';
import useContextMenu from '../../ContextMenu/useContextMenu';
import styles from './KeyValue.css';

import type {Element} from 'react';
import type {InspectPath} from './SelectedElement';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type KeyValueProps = {|
  alphaSort: boolean,
  depth: number,
  hidden?: boolean,
  inspectPath?: InspectPath,
  isReadOnly?: boolean,
  name: string,
  overrideValueFn?: ?OverrideValueFn,
  path: Array<any>,
  pathRoot: string,
  value: any,
|};

export default function KeyValue({
  alphaSort,
  depth,
  inspectPath,
  isReadOnly,
  hidden,
  name,
  overrideValueFn,
  path,
  pathRoot,
  value,
}: KeyValueProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const prevIsOpenRef = useRef(isOpen);
  const contextMenuTriggerRef = useRef(null);

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

  useContextMenu({
    data: {
      path: [pathRoot, ...path],
      type:
        value !== null &&
        typeof value === 'object' &&
        hasOwnProperty.call(value, meta.type)
          ? value[meta.type]
          : typeof value,
    },
    id: 'SelectedElement',
    ref: contextMenuTriggerRef,
  });

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

    const isEditable = typeof overrideValueFn === 'function' && !isReadOnly;

    children = (
      <div
        key="root"
        path={path}
        className={styles.Item}
        hidden={hidden}
        ref={contextMenuTriggerRef}
        style={style}>
        <div className={styles.ExpandCollapseToggleSpacer} />
        <span className={isEditable ? styles.EditableName : styles.Name}>
          {name}
        </span>
        {isEditable ? (
          <EditableValue
            overrideValueFn={((overrideValueFn: any): OverrideValueFn)}
            path={path}
            value={value}
          />
        ) : (
          <span className={styles.Value}>{displayValue}</span>
        )}
      </div>
    );
  } else if (
    hasOwnProperty.call(value, meta.type) &&
    !hasOwnProperty.call(value, meta.unserializable)
  ) {
    children = (
      <div
        ref={contextMenuTriggerRef}
        key="root"
        className={styles.Item}
        hidden={hidden}
        style={style}>
        {isInspectable ? (
          <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        ) : (
          <div className={styles.ExpandCollapseToggleSpacer} />
        )}
        <span
          className={styles.Name}
          onClick={isInspectable ? toggleIsOpen : undefined}>
          {name}
        </span>
        <span
          className={styles.Value}
          onClick={isInspectable ? toggleIsOpen : undefined}>
          {getMetaValueLabel(value)}
        </span>
      </div>
    );
  } else {
    if (Array.isArray(value)) {
      const hasChildren = value.length > 0;
      const displayName = getMetaValueLabel(value);

      children = value.map((innerValue, index) => (
        <KeyValue
          key={index}
          alphaSort={alphaSort}
          depth={depth + 1}
          inspectPath={inspectPath}
          isReadOnly={isReadOnly}
          hidden={hidden || !isOpen}
          name={index}
          overrideValueFn={overrideValueFn}
          path={path.concat(index)}
          pathRoot={pathRoot}
          value={value[index]}
        />
      ));
      children.unshift(
        <div
          ref={contextMenuTriggerRef}
          key={`${depth}-root`}
          className={styles.Item}
          hidden={hidden}
          style={style}>
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          <span
            className={styles.Name}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {name}
          </span>
          <span
            className={styles.Value}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {displayName}
          </span>
        </div>,
      );
    } else {
      // TRICKY
      // It's important to use Object.entries() rather than Object.keys()
      // because of the hidden meta Symbols used for hydration and unserializable values.
      const entries = Object.entries(value);
      if (alphaSort) {
        entries.sort(alphaSortEntries);
      }

      const hasChildren = entries.length > 0;
      const displayName = getMetaValueLabel(value);

      const areChildrenReadOnly = isReadOnly || !!value[meta.readonly];
      children = entries.map<Element<any>>(([key, keyValue]) => (
        <KeyValue
          key={key}
          alphaSort={alphaSort}
          depth={depth + 1}
          inspectPath={inspectPath}
          isReadOnly={areChildrenReadOnly}
          hidden={hidden || !isOpen}
          name={key}
          overrideValueFn={overrideValueFn}
          path={path.concat(key)}
          pathRoot={pathRoot}
          value={keyValue}
        />
      ));
      children.unshift(
        <div
          ref={contextMenuTriggerRef}
          key={`${depth}-root`}
          className={styles.Item}
          hidden={hidden}
          style={style}>
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          <span
            className={styles.Name}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {name}
          </span>
          <span
            className={styles.Value}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {displayName}
          </span>
        </div>,
      );
    }
  }

  return children;
}
