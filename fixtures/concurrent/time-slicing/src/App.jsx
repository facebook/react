import React, { useEffect, useState, useTransition } from "react";

import _map from "lodash/map";
import _debounce from "lodash/debounce";

import { Charts, Clock, Options } from "./components";

import { getStreamData } from "./utils";
import { OPTIONS, INITIAL_STATE, STRATEGY, QUESTION_MARK } from "./constants";

import "./index.css";

let _ignoreClick = null;

const App = () => {
  const [showDemo, setShowDemo] = useState(INITIAL_STATE.showDemo);
  const [strategy, setStrategy] = useState(INITIAL_STATE.strategy);
  const [value, setValue] = useState(INITIAL_STATE.value);
  const [showClock, setShowClock] = useState(INITIAL_STATE.showClock);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    window.addEventListener("keydown", showClockEventHandler);
    return () => {
      window.removeEventListener("keydown", showClockEventHandler);
    };
  }, []);

  const showClockEventHandler = (e) => {
    if (e.key.toLowerCase() === QUESTION_MARK) {
      e.preventDefault();
      setShowClock((prev) => !prev);
    }
  };

  const handleChartClick = (e) => {
    if (showDemo) {
      if (e.shiftKey) {
        setShowDemo(false);
      }
      return;
    }
    if (strategy !== STRATEGY.ASYNC) {
      setShowDemo((prev) => !prev);
      return;
    }
    if (_ignoreClick) {
      return;
    }
    _ignoreClick = true;

    startTransition(() => {
      setShowDemo(true);
      _ignoreClick = false;
    });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    switch (strategy) {
      case STRATEGY.SYNC:
        setValue(val);
        break;
      case STRATEGY.DEBOUNCED:
        debouncedHandleChange(val);
        break;
      case STRATEGY.ASYNC:
        startTransition(() => {
          setValue(val);
        });
        break;
      default:
        break;
    }
  };

  const debouncedHandleChange = _debounce((val) => {
    if (strategy === STRATEGY.DEBOUNCED) {
      setValue(val);
    }
  }, 1000);

  return (
    <div className="container">
      <div className="rendering">
        {_map(OPTIONS, (option) => (
          <Options
            {...option}
            key={option.strategy}
            setStrategy={setStrategy}
            currentStrategy={strategy}
          />
        ))}
      </div>
      <input
        className={"input " + strategy}
        id="input"
        placeholder="longer input → more components and DOM nodes"
        defaultValue={value}
        onChange={handleChange}
      />
      <div className="demo" onClick={handleChartClick}>
        {showDemo && (
          <Charts data={getStreamData(value)} isPending={isPending} />
        )}
        {showClock && <Clock />}
      </div>
    </div>
  );
};

export default App;
