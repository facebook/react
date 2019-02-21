// @flow

import React, { Fragment, useCallback, useRef, useState } from 'react';
import Button from './Button';
import ButtonIcon from './ButtonIcon';
import { getMetaValueLabel } from './utils';
import { meta } from '../../hydration';
import styles from './InspectedElementTree.css';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type Props = {|
  data: Object | null,
  label: string,
  overrideValueFn?: ?OverrideValueFn,
  showWhenEmpty?: boolean,
|};

export default function InspectedElementTree({
  data,
  label,
  overrideValueFn,
  showWhenEmpty = false,
}: Props) {
  const isEmpty = data === null || Object.keys(data).length === 0;

  if (isEmpty && !showWhenEmpty) {
    return null;
  } else {
    // TODO Add click and key handlers for toggling element open/close state.
    return (
      <div className={styles.InspectedElementTree}>
        <div className={styles.Header}>{label}</div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          Object.keys((data: any)).map(name => (
            <KeyValue
              key={name}
              depth={1}
              name={name}
              overrideValueFn={overrideValueFn}
              path={[name]}
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
  nameClassName?: string,
  overrideValueFn?: ?OverrideValueFn,
  path?: Array<any>,
  value: any,
|};

export function KeyValue({
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

type EditableValueProps = {|
  dataType: string,
  overrideValueFn: OverrideValueFn,
  path: Array<string | number>,
  value: any,
|};

export function EditableValue({
  dataType,
  overrideValueFn,
  path,
  value,
}: EditableValueProps) {
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [editableValue, setEditableValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (hasPendingChanges && editableValue === value) {
    setHasPendingChanges(false);
  }

  const handleChange = useCallback(
    ({ target }) => {
      if (dataType === 'boolean') {
        setEditableValue(target.checked);
        overrideValueFn(path, target.checked);
      } else if (dataType === 'number') {
        setEditableValue(parseFloat(target.value));
      } else {
        setEditableValue(target.value);
      }
      setHasPendingChanges(true);
    },
    [dataType, overrideValueFn, path]
  );

  const handleReset = useCallback(() => {
    setEditableValue(value);
    setHasPendingChanges(false);

    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [value]);

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      const { key } = event;

      if (key === 'Enter') {
        overrideValueFn(path, editableValue);

        // Don't reset the pending change flag here.
        // The inspected fiber won't be updated until after the next "inspectElement" message.
        // We'll reset that flag during a subsequent render.
      } else if (key === 'Escape') {
        setEditableValue(value);
        setHasPendingChanges(false);
      }
    },
    [path, editableValue, overrideValueFn, value]
  );

  // Render different input types based on the dataType
  let type = 'text';
  if (dataType === 'boolean') {
    type = 'checkbox';
  } else if (dataType === 'number') {
    type = 'number';
  }

  let inputValue = value == null ? '' : value;
  if (hasPendingChanges) {
    inputValue = editableValue == null ? '' : editableValue;
  }

  return (
    <Fragment>
      <label className={styles.ValueInputLabel}>
        <input
          checked={dataType === 'boolean' ? inputValue : undefined}
          className={styles.ValueInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          type={type}
          value={dataType === 'boolean' ? undefined : inputValue}
        />
      </label>
      {hasPendingChanges && dataType !== 'boolean' && (
        <Button
          className={styles.ResetButton}
          onClick={handleReset}
          title="Reset value"
        >
          <ButtonIcon type="undo" />
        </Button>
      )}
    </Fragment>
  );
}
