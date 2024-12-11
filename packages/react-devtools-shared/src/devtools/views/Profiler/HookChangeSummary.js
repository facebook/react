import * as React from 'react';
import {
  useContext,
  useMemo,
  useCallback,
  memo,
  useState,
  useEffect,
} from 'react';
import styles from './HookChangeSummary.css';
import ButtonIcon from '../ButtonIcon';
import {InspectedElementContext} from '../Components/InspectedElementContext';
import {StoreContext} from '../context';
import {
  HooksList,
  State,
} from 'react-devtools-shared/src/devtools/views/Profiler/types';

import {
  getAlreadyLoadedHookNames,
  getHookSourceLocationKey,
} from 'react-devtools-shared/src/hookNamesCache';
import Toggle from '../Toggle';

const hookListFormatter = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

const Hook = memo(({hook, hookNames}) => {
  const hookSource = hook.hookSource;
  const hookName = useMemo(() => {
    if (!hookSource || !hookNames) return null;
    const key = getHookSourceLocationKey(hookSource);
    return hookNames.get(key) || null;
  }, [hookSource, hookNames]);

  return (
    <ul className={styles.Hook}>
      <li>
        {hook.id !== null && (
          <span className={styles.PrimitiveHookNumber}>{hook.id + 1}</span>
        )}
        <span
          className={hook.id !== null ? styles.PrimitiveHookName : styles.Name}>
          {hook.name}
          {hookName && <span className={styles.HookName}>({hookName})</span>}
        </span>
        {hook.subHooks?.map((subHook, index) => (
          <Hook
            key={`${hook.id}-${index}`}
            hook={subHook}
            hookNames={hookNames}
          />
        ))}
      </li>
    </ul>
  );
});

const shouldKeepHook = (hook, hooksArray) => {
  if (hook.id !== null && hooksArray.includes(hook.id)) {
    return true;
  }
  return (
    hook.subHooks?.some(subHook => shouldKeepHook(subHook, hooksArray)) ?? false
  );
};

const filterHooks = (hook, hooksArray) => {
  if (!shouldKeepHook(hook, hooksArray)) {
    return null;
  }

  if (hook.subHooks?.length > 0) {
    const filteredSubHooks = hook.subHooks
      .map(subHook => filterHooks(subHook, hooksArray))
      .filter(Boolean);

    return filteredSubHooks.length > 0
      ? {...hook, subHooks: filteredSubHooks}
      : {...hook};
  }

  return hook;
};

type Props = {
  fiberID: number,
  hooks: HooksList | null,
  state: State | null,
  displayMode?: 'detailed' | 'compact',
};
const HookChangeSummary = memo(
  ({hooks, fiberID, state, displayMode = 'detailed'}: Props) => {
    const {parseHookNames, toggleParseHookNames, inspectedElement} = useContext(
      InspectedElementContext,
    );
    const store = useContext(StoreContext);

    const [parseHookNamesOptimistic, setParseHookNamesOptimistic] =
      useState(parseHookNames);

    useEffect(() => {
      setParseHookNamesOptimistic(parseHookNames);
    }, [inspectedElement?.id, parseHookNames]);

    const handleOnChange = useCallback(() => {
      setParseHookNamesOptimistic(!parseHookNames);
      toggleParseHookNames();
    }, [toggleParseHookNames, parseHookNames]);

    const element = fiberID !== null ? store.getElementByID(fiberID) : null;
    const hookNames = getAlreadyLoadedHookNames(element);

    const filteredHooks = useMemo(() => {
      if (!hooks || !inspectedElement?.hooks) return null;
      return inspectedElement.hooks
        .map(hook => filterHooks(hook, hooks))
        .filter(Boolean);
    }, [inspectedElement?.hooks, hooks]);

    const hookParsingFailed = useMemo(
      () => parseHookNames && hookNames === null,
      [parseHookNames, hookNames],
    );

    if (!hooks?.length) {
      return <span>No hooks changed</span>;
    }

    // Fallback to old list of ids when inspectedElement ID doesn't match element ID or when hook counts differ
    if (
      inspectedElement?.id !== element?.id ||
      filteredHooks?.length !== hooks.length ||
      displayMode === 'compact'
    ) {
      const hookIds = hooks.map(hookId => String(hookId + 1));
      const hookWord = hookIds.length === 1 ? '• Hook' : '• Hooks';
      return (
        <span>
          {hookWord} {hookListFormatter.format(hookIds)} changed
        </span>
      );
    }

    let toggleTitle;
    if (hookParsingFailed) {
      toggleTitle = 'Hook parsing failed';
    } else if (parseHookNamesOptimistic) {
      toggleTitle = 'Parsing hook names ...';
    } else {
      toggleTitle = 'Parse hook names (may be slow)';
    }

    return (
      <div>
        {filteredHooks.length > 1 ? '• Hooks changed:' : '• Hook changed:'}
        {(!parseHookNames || hookParsingFailed) && (
          <Toggle
            className={
              hookParsingFailed
                ? styles.ToggleError
                : styles.LoadHookNamesToggle
            }
            isChecked={parseHookNamesOptimistic}
            isDisabled={parseHookNamesOptimistic || hookParsingFailed}
            onChange={handleOnChange}
            title={toggleTitle}>
            <ButtonIcon type="parse-hook-names" />
          </Toggle>
        )}
        {filteredHooks.map(hook => (
          <Hook
            key={`${inspectedElement?.id}-${hook.id}`}
            hook={hook}
            hookNames={hookNames}
          />
        ))}
      </div>
    );
  },
);

export default HookChangeSummary;
