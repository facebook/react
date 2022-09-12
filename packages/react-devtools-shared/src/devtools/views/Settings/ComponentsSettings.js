/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../../constants';
import {useLocalStorage, useSubscription} from '../hooks';
import {StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import {SettingsContext} from '../Settings/SettingsContext';
import {
  ComponentFilterDisplayName,
  ComponentFilterElementType,
  ComponentFilterHOC,
  ComponentFilterLocation,
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeFunction,
  ElementTypeForwardRef,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeSuspense,
} from 'react-devtools-shared/src/types';
import {getDefaultOpenInEditorURL} from 'react-devtools-shared/src/utils';

import styles from './SettingsShared.css';

import type {
  BooleanComponentFilter,
  ComponentFilter,
  ComponentFilterType,
  ElementType,
  ElementTypeComponentFilter,
  RegExpComponentFilter,
} from 'react-devtools-shared/src/types';

export default function ComponentsSettings(_: {}): React.Node {
  const store = useContext(StoreContext);
  const {parseHookNames, setParseHookNames} = useContext(SettingsContext);

  const collapseNodesByDefaultSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.collapseNodesByDefault,
      subscribe: (callback: Function) => {
        store.addListener('collapseNodesByDefault', callback);
        return () => store.removeListener('collapseNodesByDefault', callback);
      },
    }),
    [store],
  );
  const collapseNodesByDefault = useSubscription<boolean>(
    collapseNodesByDefaultSubscription,
  );

  const updateCollapseNodesByDefault = useCallback(
    ({currentTarget}) => {
      store.collapseNodesByDefault = !currentTarget.checked;
    },
    [store],
  );

  const updateParseHookNames = useCallback(
    ({currentTarget}) => {
      setParseHookNames(currentTarget.checked);
    },
    [setParseHookNames],
  );

  const [openInEditorURL, setOpenInEditorURL] = useLocalStorage<string>(
    LOCAL_STORAGE_OPEN_IN_EDITOR_URL,
    getDefaultOpenInEditorURL(),
  );

  const [componentFilters, setComponentFilters] = useState<
    Array<ComponentFilter>,
  >(() => [...store.componentFilters]);

  const addFilter = useCallback(() => {
    setComponentFilters(prevComponentFilters => {
      return [
        ...prevComponentFilters,
        {
          type: ComponentFilterElementType,
          value: ElementTypeHostComponent,
          isEnabled: true,
        },
      ];
    });
  }, []);

  const changeFilterType = useCallback(
    (componentFilter: ComponentFilter, type: ComponentFilterType) => {
      setComponentFilters(prevComponentFilters => {
        const cloned: Array<ComponentFilter> = [...prevComponentFilters];
        const index = prevComponentFilters.indexOf(componentFilter);
        if (index >= 0) {
          if (type === ComponentFilterElementType) {
            cloned[index] = {
              type: ComponentFilterElementType,
              isEnabled: componentFilter.isEnabled,
              value: ElementTypeHostComponent,
            };
          } else if (type === ComponentFilterDisplayName) {
            cloned[index] = {
              type: ComponentFilterDisplayName,
              isEnabled: componentFilter.isEnabled,
              isValid: true,
              value: '',
            };
          } else if (type === ComponentFilterLocation) {
            cloned[index] = {
              type: ComponentFilterLocation,
              isEnabled: componentFilter.isEnabled,
              isValid: true,
              value: '',
            };
          } else if (type === ComponentFilterHOC) {
            cloned[index] = {
              type: ComponentFilterHOC,
              isEnabled: componentFilter.isEnabled,
              isValid: true,
            };
          }
        }
        return cloned;
      });
    },
    [],
  );

  const updateFilterValueElementType = useCallback(
    (componentFilter: ComponentFilter, value: ElementType) => {
      if (componentFilter.type !== ComponentFilterElementType) {
        throw Error('Invalid value for element type filter');
      }

      setComponentFilters(prevComponentFilters => {
        const cloned: Array<ComponentFilter> = [...prevComponentFilters];
        if (componentFilter.type === ComponentFilterElementType) {
          const index = prevComponentFilters.indexOf(componentFilter);
          if (index >= 0) {
            cloned[index] = {
              ...componentFilter,
              value,
            };
          }
        }
        return cloned;
      });
    },
    [],
  );

  const updateFilterValueRegExp = useCallback(
    (componentFilter: ComponentFilter, value: string) => {
      if (componentFilter.type === ComponentFilterElementType) {
        throw Error('Invalid value for element type filter');
      }

      setComponentFilters(prevComponentFilters => {
        const cloned: Array<ComponentFilter> = [...prevComponentFilters];
        if (
          componentFilter.type === ComponentFilterDisplayName ||
          componentFilter.type === ComponentFilterLocation
        ) {
          const index = prevComponentFilters.indexOf(componentFilter);
          if (index >= 0) {
            let isValid = true;
            try {
              new RegExp(value); // eslint-disable-line no-new
            } catch (error) {
              isValid = false;
            }
            cloned[index] = {
              ...componentFilter,
              isValid,
              value,
            };
          }
        }
        return cloned;
      });
    },
    [],
  );

  const removeFilter = useCallback((index: number) => {
    setComponentFilters(prevComponentFilters => {
      const cloned: Array<ComponentFilter> = [...prevComponentFilters];
      cloned.splice(index, 1);
      return cloned;
    });
  }, []);

  const toggleFilterIsEnabled = useCallback(
    (componentFilter: ComponentFilter, isEnabled: boolean) => {
      setComponentFilters(prevComponentFilters => {
        const cloned: Array<ComponentFilter> = [...prevComponentFilters];
        const index = prevComponentFilters.indexOf(componentFilter);
        if (index >= 0) {
          if (componentFilter.type === ComponentFilterElementType) {
            cloned[index] = {
              ...((cloned[index]: any): ElementTypeComponentFilter),
              isEnabled,
            };
          } else if (
            componentFilter.type === ComponentFilterDisplayName ||
            componentFilter.type === ComponentFilterLocation
          ) {
            cloned[index] = {
              ...((cloned[index]: any): RegExpComponentFilter),
              isEnabled,
            };
          } else if (componentFilter.type === ComponentFilterHOC) {
            cloned[index] = {
              ...((cloned[index]: any): BooleanComponentFilter),
              isEnabled,
            };
          }
        }
        return cloned;
      });
    },
    [],
  );

  // Filter updates are expensive to apply (since they impact the entire tree).
  // Only apply them on unmount.
  // The Store will avoid doing any expensive work unless they've changed.
  // We just want to batch the work in the event that they do change.
  const componentFiltersRef = useRef<Array<ComponentFilter>>(componentFilters);
  useEffect(() => {
    componentFiltersRef.current = componentFilters;
    return () => {};
  }, [componentFilters]);
  useEffect(
    () => () => {
      store.componentFilters = [...componentFiltersRef.current];
    },
    [store],
  );

  return (
    <div className={styles.Settings}>
      <label className={styles.Setting}>
        <input
          type="checkbox"
          checked={!collapseNodesByDefault}
          onChange={updateCollapseNodesByDefault}
        />{' '}
        Expand component tree by default
      </label>

      <label className={styles.Setting}>
        <input
          type="checkbox"
          checked={parseHookNames}
          onChange={updateParseHookNames}
        />{' '}
        Always parse hook names from source{' '}
        <span className={styles.Warning}>(may be slow)</span>
      </label>

      <label className={styles.OpenInURLSetting}>
        Open in Editor URL:{' '}
        <input
          className={styles.Input}
          type="text"
          placeholder={process.env.EDITOR_URL ?? 'vscode://file/{path}:{line}'}
          value={openInEditorURL}
          onChange={event => {
            setOpenInEditorURL(event.target.value);
          }}
        />
      </label>

      <div className={styles.Header}>Hide components where...</div>

      <table className={styles.Table}>
        <tbody>
          {componentFilters.length === 0 && (
            <tr className={styles.TableRow}>
              <td className={styles.NoFiltersCell}>
                No filters have been added.
              </td>
            </tr>
          )}
          {componentFilters.map((componentFilter, index) => (
            <tr className={styles.TableRow} key={index}>
              <td className={styles.TableCell}>
                <Toggle
                  className={
                    componentFilter.isValid !== false
                      ? ''
                      : styles.InvalidRegExp
                  }
                  isChecked={componentFilter.isEnabled}
                  onChange={isEnabled =>
                    toggleFilterIsEnabled(componentFilter, isEnabled)
                  }
                  title={
                    componentFilter.isValid === false
                      ? 'Filter invalid'
                      : componentFilter.isEnabled
                      ? 'Filter enabled'
                      : 'Filter disabled'
                  }>
                  <ToggleIcon
                    isEnabled={componentFilter.isEnabled}
                    isValid={
                      componentFilter.isValid == null ||
                      componentFilter.isValid === true
                    }
                  />
                </Toggle>
              </td>
              <td className={styles.TableCell}>
                <select
                  className={styles.Select}
                  value={componentFilter.type}
                  onChange={({currentTarget}) =>
                    changeFilterType(
                      componentFilter,
                      ((parseInt(
                        currentTarget.value,
                        10,
                      ): any): ComponentFilterType),
                    )
                  }>
                  <option value={ComponentFilterLocation}>location</option>
                  <option value={ComponentFilterDisplayName}>name</option>
                  <option value={ComponentFilterElementType}>type</option>
                  <option value={ComponentFilterHOC}>hoc</option>
                </select>
              </td>
              <td className={styles.TableCell}>
                {componentFilter.type === ComponentFilterElementType &&
                  'equals'}
                {(componentFilter.type === ComponentFilterLocation ||
                  componentFilter.type === ComponentFilterDisplayName) &&
                  'matches'}
              </td>
              <td className={styles.TableCell}>
                {componentFilter.type === ComponentFilterElementType && (
                  <select
                    className={styles.Select}
                    value={componentFilter.value}
                    onChange={({currentTarget}) =>
                      updateFilterValueElementType(
                        componentFilter,
                        ((parseInt(currentTarget.value, 10): any): ElementType),
                      )
                    }>
                    <option value={ElementTypeClass}>class</option>
                    <option value={ElementTypeContext}>context</option>
                    <option value={ElementTypeFunction}>function</option>
                    <option value={ElementTypeForwardRef}>forward ref</option>
                    <option value={ElementTypeHostComponent}>
                      host (e.g. &lt;div&gt;)
                    </option>
                    <option value={ElementTypeMemo}>memo</option>
                    <option value={ElementTypeOtherOrUnknown}>other</option>
                    <option value={ElementTypeProfiler}>profiler</option>
                    <option value={ElementTypeSuspense}>suspense</option>
                  </select>
                )}
                {(componentFilter.type === ComponentFilterLocation ||
                  componentFilter.type === ComponentFilterDisplayName) && (
                  <input
                    className={styles.Input}
                    type="text"
                    placeholder="Regular expression"
                    onChange={({currentTarget}) =>
                      updateFilterValueRegExp(
                        componentFilter,
                        currentTarget.value,
                      )
                    }
                    value={componentFilter.value}
                  />
                )}
              </td>
              <td className={styles.TableCell}>
                <Button
                  onClick={() => removeFilter(index)}
                  title="Delete filter">
                  <ButtonIcon type="delete" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button onClick={addFilter}>
        <ButtonIcon className={styles.ButtonIcon} type="add" />
        Add filter
      </Button>
    </div>
  );
}

type ToggleIconProps = {
  isEnabled: boolean,
  isValid: boolean,
};
function ToggleIcon({isEnabled, isValid}: ToggleIconProps) {
  let className;
  if (isValid) {
    className = isEnabled ? styles.ToggleOn : styles.ToggleOff;
  } else {
    className = isEnabled ? styles.ToggleOnInvalid : styles.ToggleOffInvalid;
  }
  return (
    <div className={className}>
      <div
        className={isEnabled ? styles.ToggleInsideOn : styles.ToggleInsideOff}
      />
    </div>
  );
}
