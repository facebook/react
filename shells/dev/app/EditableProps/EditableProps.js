// @flow

import React, { createContext, Component, Fragment } from 'react';
import styles from './EditableProps.css';

type StatefulFunctionProps = {| count: number |};

function StatefulFunction({ count }: StatefulFunctionProps) {
  return <li>Count: {count}</li>;
}

const BoolContext = createContext(true);
// $FlowFixMe Flow does not yet know about Context.displayName
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
        <StatefulFunction count={1} />
      </ul>
    </div>
  );
}
