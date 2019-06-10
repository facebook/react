// @flow

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSubscription } from '../hooks';
import { StoreContext } from '../context';
import Store from 'src/devtools/store';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import { shallowDiffers } from 'src/utils';
import {
  ComponentFilterDisplayName,
  ComponentFilterElementType,
  ComponentFilterHOC,
  ComponentFilterLocation,
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeEventTarget,
  ElementTypeFunction,
  ElementTypeForwardRef,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeSuspense,
} from 'src/types';

import styles from './SettingsShared.css';

import type {
  BooleanComponentFilter,
  ComponentFilter,
  ComponentFilterType,
  ElementType,
  ElementTypeComponentFilter,
  RegExpComponentFilter,
} from 'src/types';

export default function ComponentsSettings(_: {||}) {
  const store = useContext(StoreContext);

  const collapseNodesByDefaultSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.collapseNodesByDefault,
      subscribe: (callback: Function) => {
        store.addListener('collapseNodesByDefault', callback);
        return () => store.removeListener('collapseNodesByDefault', callback);
      },
    }),
    [store]
  );
  const collapseNodesByDefault = useSubscription<boolean, Store>(
    collapseNodesByDefaultSubscription
  );

  const updateCollapseNodesByDefault = useCallback(
    ({ currentTarget }) => {
      store.collapseNodesByDefault = currentTarget.checked;
    },
    [store]
  );

  const [componentFilters, setComponentFilters] = useState<
    Array<ComponentFilter>
  >(() => [...store.componentFilters]);

  const addFilter = useCallback(() => {
    setComponentFilters(componentFilters => {
      return [
        ...componentFilters,
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
      setComponentFilters(componentFilters => {
        const cloned: Array<ComponentFilter> = [...componentFilters];
        const index = componentFilters.indexOf(componentFilter);
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
    []
  );

  const updateFilterValueElementType = useCallback(
    (componentFilter: ComponentFilter, value: ElementType) => {
      if (componentFilter.type !== ComponentFilterElementType) {
        throw Error('Invalid value for element type filter');
      }

      setComponentFilters(componentFilters => {
        const cloned: Array<ComponentFilter> = [...componentFilters];
        if (componentFilter.type === ComponentFilterElementType) {
          const index = componentFilters.indexOf(componentFilter);
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
    []
  );

  const updateFilterValueRegExp = useCallback(
    (componentFilter: ComponentFilter, value: string) => {
      if (componentFilter.type === ComponentFilterElementType) {
        throw Error('Invalid value for element type filter');
      }

      setComponentFilters(componentFilters => {
        const cloned: Array<ComponentFilter> = [...componentFilters];
        if (
          componentFilter.type === ComponentFilterDisplayName ||
          componentFilter.type === ComponentFilterLocation
        ) {
          const index = componentFilters.indexOf(componentFilter);
          if (index >= 0) {
            let isValid = true;
            try {
              new RegExp(value);
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
    []
  );

  const removeFilter = useCallback((index: number) => {
    setComponentFilters(componentFilters => {
      const cloned: Array<ComponentFilter> = [...componentFilters];
      cloned.splice(index, 1);
      return cloned;
    });
  }, []);

  const toggleFilterIsEnabled = useCallback(
    (componentFilter: ComponentFilter, isEnabled: boolean) => {
      setComponentFilters(componentFilters => {
        const cloned: Array<ComponentFilter> = [...componentFilters];
        const index = componentFilters.indexOf(componentFilter);
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
    []
  );

  // Filter updates are expensive to apply (since they impact the entire tree).
  // Only apply them on unmount, and only if they've actually changed.
  const componentFiltersRef = useRef<Array<ComponentFilter>>(componentFilters);
  useEffect(() => {
    componentFiltersRef.current = componentFilters;
    return () => {};
  }, [componentFilters]);
  useEffect(
    () => () => {
      const prevComponentFilters = store.componentFilters;
      const nextComponentFilters = componentFiltersRef.current;

      let haveFiltersChanged =
        prevComponentFilters.length !== nextComponentFilters.length;
      if (!haveFiltersChanged) {
        for (let i = 0; i < nextComponentFilters.length; i++) {
          if (
            shallowDiffers(prevComponentFilters[i], nextComponentFilters[i])
          ) {
            haveFiltersChanged = true;
            break;
          }
        }
      }

      if (haveFiltersChanged) {
        store.componentFilters = [...nextComponentFilters];
      }
    },
    [store]
  );

  return (
    <div className={styles.Settings}>
      <label className={styles.Setting}>
        <input
          type="checkbox"
          checked={collapseNodesByDefault}
          onChange={updateCollapseNodesByDefault}
        />{' '}
        Collapse newly added components by default
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
                  }
                >
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
                  onChange={({ currentTarget }) =>
                    changeFilterType(
                      componentFilter,
                      ((parseInt(
                        currentTarget.value,
                        10
                      ): any): ComponentFilterType)
                    )
                  }
                >
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
                    onChange={({ currentTarget }) =>
                      updateFilterValueElementType(
                        componentFilter,
                        ((parseInt(currentTarget.value, 10): any): ElementType)
                      )
                    }
                  >
                    <option value={ElementTypeClass}>class</option>
                    <option value={ElementTypeContext}>context</option>
                    <option value={ElementTypeEventTarget}>event</option>
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
                    onChange={({ currentTarget }) =>
                      updateFilterValueRegExp(
                        componentFilter,
                        currentTarget.value
                      )
                    }
                    value={componentFilter.value}
                  />
                )}
              </td>
              <td className={styles.TableCell}>
                <Button
                  onClick={() => removeFilter(index)}
                  title="Delete filter"
                >
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

type ToggleIconProps = {|
  isEnabled: boolean,
  isValid: boolean,
|};
function ToggleIcon({ isEnabled, isValid }: ToggleIconProps) {
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
