// @flow

import React, {
  createContext,
  Component,
  Fragment,
  useCallback,
  useDebugValue,
  useEffect,
  useReducer,
  useState,
} from 'react';
import styles from './EditableProps.css';

const initialData = { foo: 'FOO', bar: 'BAR' };

function reducer(state, action) {
  switch (action.type) {
    case 'swap':
      return { foo: state.bar, bar: state.foo };
    default:
      throw new Error();
  }
}

type StatefulFunctionProps = {| name: string |};

function StatefulFunction({ name }: StatefulFunctionProps) {
  const [count, updateCount] = useState(0);
  const debouncedCount = useDebounce(count, 1000);
  const handleUpdateCountClick = useCallback(() => updateCount(count + 1), [
    count,
  ]);

  const [data, dispatch] = useReducer(reducer, initialData);
  const handleUpdateReducerClick = useCallback(
    () => dispatch({ type: 'swap' }),
    []
  );

  return (
    <Fragment>
      <li>Name: {name}</li>
      <li>
        <button onClick={handleUpdateCountClick}>
          Debounced count: {debouncedCount}
        </button>
      </li>
      <li>
        Reducer state: foo "{data.foo}", bar "{data.bar}"
      </li>
      <li>
        <button onClick={handleUpdateReducerClick}>Swap reducer values</button>
      </li>
    </Fragment>
  );
}

const BoolContext = createContext(true);
BoolContext.displayName = 'BoolContext';

type Props = {| name: string, toggle: boolean |};
type State = {| cities: Array<string>, state: string |};

class StatefulClass extends Component<Props, State> {
  static contextType = BoolContext;

  state: State = {
    cities: ['San Francisco', 'San Jose'],
    state: 'California',
  };

  handleChange = ({ target }) =>
    this.setState({
      state: target.value,
    });

  render() {
    return (
      <Fragment>
        <li>Name: {this.props.name}</li>
        <li>Toggle: {this.props.toggle ? 'true' : 'false'}</li>
        <li>
          State: <input value={this.state.state} onChange={this.handleChange} />
        </li>
        <li>Cities: {this.state.cities.join(', ')}</li>
        <li>Context: {this.context ? 'true' : 'false'}</li>
      </Fragment>
    );
  }
}

export default function EditableProps() {
  return (
    <div className={styles.App}>
      <div className={styles.Header}>Editable props</div>
      <ul>
        <StatefulClass name="Brian" toggle={true} />
        <StatefulFunction name="Brian" />
      </ul>
    </div>
  );
}

// Below copied from https://usehooks.com/
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Show the value in DevTools
  useDebugValue(debouncedValue);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}
// Above copied from https://usehooks.com/
