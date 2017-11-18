// as specified https://github.com/facebook/react/issues/9866
import React, {Component} from 'react';
import InputElements from './InputElements';
import SelectElements from './SelectElements';

export default class FormElementTests extends Component {
  render() {
    return (
      <div>
        <InputElements />
        <SelectElements />
      </div>
    );
  }
}
