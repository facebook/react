// @flow

import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModalDismissSignal, useSubscription } from '../hooks';
import { ComponentFiltersModalContext } from './ComponentFiltersModalContext';
import { StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import Store from 'src/devtools/store';
import {
  ComponentFilterElementType,
  ComponentFilterDisplayName,
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
import styles from './ComponentFiltersModal.css';

import type {
  ComponentFilter,
  ComponentFilterType,
  ElementType,
  ElementTypeComponentFilter,
  RegExpComponentFilter,
} from 'src/types';

export default function ComponentFiltersModalWrapper(_: {||}) {
  const store = useContext(StoreContext);
  const { profilerStore } = store;

  const { isModalShowing, setIsModalShowing } = useContext(
    ComponentFiltersModalContext
  );

  // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
  // If necessary, we could support this- but it doesn't seem like a necessary use case.
  const isProfilingSubscription = useMemo(
    () => ({
      getCurrentValue: () => profilerStore.isProfiling,
      subscribe: (callback: Function) => {
        profilerStore.addListener('isProfiling', callback);
        return () => profilerStore.removeListener('isProfiling', callback);
      },
    }),
    [profilerStore]
  );
  const isProfiling = useSubscription<boolean, Store>(isProfilingSubscription);
  if (isProfiling && isModalShowing) {
    setIsModalShowing(false);
  }

  return isModalShowing ? (
    <ComponentFiltersModal
      store={store}
      setIsModalShowing={setIsModalShowing}
    />
  ) : null;
}

type Props = {|
  store: Store,
  setIsModalShowing: (value: boolean) => void,
|};

function ComponentFiltersModal({ store, setIsModalShowing }: Props) {
  const dismissModal = useCallback(() => setIsModalShowing(false), [
    setIsModalShowing,
  ]);

  const modalRef = useRef<HTMLDivElement | null>(null);

  useModalDismissSignal(modalRef, dismissModal);

  const {
    addFilter,
    changeFilterType,
    updateFilterValueElementType,
    updateFilterValueRegExp,
    componentFilters,
    removeFilter,
    saveFilters,
    toggleFilterIsEnabled,
  } = useComponentFilters();

  const saveAndClose = useCallback(() => {
    saveFilters();
    dismissModal();
  }, [dismissModal, saveFilters]);

  return (
    <div className={styles.Background}>
      <div className={styles.Modal} ref={modalRef}>
        <div className={styles.LeftRight}>
          <div className={styles.Left}>Hide components where...</div>
          <div className={styles.Right}>
            <Button onClick={addFilter}>
              <ButtonIcon className={styles.ButtonIcon} type="add" />
              Add filter
            </Button>
          </div>
        </div>
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
                  </select>
                </td>
                <td className={styles.TableCell}>
                  {componentFilter.type === ComponentFilterElementType
                    ? 'equals'
                    : 'matches'}
                </td>
                <td className={styles.TableCell}>
                  {componentFilter.type === ComponentFilterElementType ? (
                    <select
                      className={styles.Select}
                      value={componentFilter.value}
                      onChange={({ currentTarget }) =>
                        updateFilterValueElementType(
                          componentFilter,
                          ((parseInt(
                            currentTarget.value,
                            10
                          ): any): ElementType)
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
                  ) : (
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
        <div className={styles.LeftRight}>
          <div className={styles.Right}>
            <Button className={styles.CancelButton} onClick={dismissModal}>
              Cancel
            </Button>
            <Button onClick={saveAndClose}>Save Changes</Button>
          </div>
        </div>
      </div>
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

function useComponentFilters() {
  const store = useContext(StoreContext);

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

  const saveFilters = useCallback(() => {
    store.componentFilters = [...componentFilters];
  }, [componentFilters, store]);

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
          }
        }
        return cloned;
      });
    },
    []
  );

  return {
    addFilter,
    changeFilterType,
    componentFilters,
    removeFilter,
    saveFilters,
    toggleFilterIsEnabled,
    updateFilterValueElementType,
    updateFilterValueRegExp,
  };
}
