// @flow

import React, { useCallback, useState } from 'react';
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
  overrideValueFn?: ?OverrideValueFn,
  path?: Array<any>,
  value: any,
|};

export function KeyValue({
  depth,
  name,
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
        <span className={styles.Name}>{name}</span>
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
        <span className={styles.Name}>{name}</span>
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
          <span className={styles.Name}>{name}</span>
          <span>Array</span>
        </div>
      );
    } else {
      // $FlowFixMe
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
          <span className={styles.Name}>{name}</span>
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

function EditableValue({
  dataType,
  overrideValueFn,
  path,
  value,
}: EditableValueProps) {
  const [editableValue, setEditableValue] = useState(value);

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
    },
    [dataType, setEditableValue]
  );

  const handleKeyPress = useCallback(
    ({ key }) => {
      if (key === 'Enter') {
        overrideValueFn(path, editableValue);
      }
    },
    [path, editableValue, overrideValueFn]
  );

  const handleKeyDown = useCallback(event => event.stopPropagation(), []);

  // Render different input types based on the dataType
  let type = 'text';
  if (dataType === 'boolean') {
    type = 'checkbox';
  } else if (dataType === 'number') {
    type = 'number';
  }

  return (
    <label className={styles.ValueInputLabel}>
      <input
        checked={dataType === 'boolean' ? editableValue : undefined}
        className={styles.ValueInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        type={type}
        value={dataType === 'boolean' ? undefined : editableValue || ''}
      />
    </label>
  );
}
