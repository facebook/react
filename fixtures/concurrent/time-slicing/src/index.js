import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import _ from 'lodash';
import Charts from './Charts';
import Clock from './Clock';
import './index.css';
import {useTransition} from 'react';

let cachedData = new Map();

function App() {
  const [value, setValue] = useState('');
  const [strategy, setStrategy] = useState('sync');
  const [showDemo, setShowDemo] = useState(true);
  const [showClock, setShowClock] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Random data for the chart
  function getStreamData(input) {
    if (cachedData.has(input)) {
      return cachedData.get(input);
    }
    const multiplier = input.length !== 0 ? input.length : 1;
    const complexity =
      (parseInt(window.location.search.slice(1), 10) / 100) * 25 || 25;
    const data = _.range(5).map(t =>
      _.range(complexity * multiplier).map((j, i) => {
        return {
          x: j,
          y: (t + 1) * _.random(0, 255),
        };
      })
    );
    cachedData.set(input, data);
    return data;
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key.toLowerCase() === '?') {
        e.preventDefault();
        setShowClock(prevShowClock => !prevShowClock);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChartClick = e => {
    if (showDemo) {
      if (e.shiftKey) {
        setShowDemo(false);
      }
      return;
    }
    if (strategy !== 'async') {
      setShowDemo(prevShowDemo => !prevShowDemo);
      return;
    }
    if (ignoreClick) {
      return;
    }
    ignoreClick = true;

    setShowDemo(true);
    ignoreClick = false;
  };

  const debouncedHandleChange = _.debounce(newValue => {
    if (strategy === 'debounced') {
      setValue(newValue);
    }
  }, 1000);

  const renderOption = (strategyOption, label) => (
    <label className={strategyOption === strategy ? 'selected' : null}>
      <input
        type="radio"
        checked={strategyOption === strategy}
        onChange={() => setStrategy(strategyOption)}
      />
      {label}
    </label>
  );

  const handleChange = e => {
    const newValue = e.target.value;
    switch (strategy) {
      case 'sync':
        setValue(newValue);
        break;
      case 'debounced':
        debouncedHandleChange(newValue);
        break;
      case 'async':
        startTransition(() => {
          setValue(newValue);
        });
        break;
      default:
        break;
    }
  };

  const data = getStreamData(value);

  return (
    <div className="container">
      <div className="rendering">
        {renderOption('sync', 'Synchronous')}
        {renderOption('debounced', 'Debounced')}
        {renderOption('async', 'Concurrent')}
      </div>
      <input
        className={'input ' + strategy}
        placeholder="longer input → more components and DOM nodes"
        defaultValue={value}
        onChange={handleChange}
      />
      <div className="demo" onClick={handleChartClick}>
        {showDemo && <Charts data={data} onClick={handleChartClick} />}
        <div style={{display: showClock ? 'block' : 'none'}}>
          <Clock />
        </div>
      </div>
    </div>
  );
}

let ignoreClick = false;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
