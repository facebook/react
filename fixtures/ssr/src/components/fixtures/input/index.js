import React from 'react';
import controlled from '../../hoc/controlled';

const Input = (props) => <input {...props} />;
const ControlledInput = controlled(Input);

import Checkbox from './checkbox';
import Radio from './radio';

function InputTypeFixture(props) {
  return (
    <div>
      <div>
        <label>Input type="{props.type}" uncontrolled</label>
        <Input {...props} />
      </div>
      <div>
        <label>Input type="{props.type}" controlled</label>
        <ControlledInput {...props} />
      </div>
    </div>
  )
}

export default function InputFixture() {
  return (
    <React.Fragment>
      <h2>React SSR Input</h2>
      <Checkbox /> <hr />
      <Radio /> <hr />
      <InputTypeFixture type="text" /> <hr />
      <InputTypeFixture type="button" value="Button" /> <hr />
      <InputTypeFixture type="email" /> <hr />
      <InputTypeFixture type="tel" /> <hr />
      <InputTypeFixture type="url" /> <hr />
      <InputTypeFixture type="number" /> <hr />
      <InputTypeFixture type="step" /> <hr />
      <InputTypeFixture type="color" /> <hr />
      <InputTypeFixture type="date" /> <hr />
      <InputTypeFixture type="week" /> <hr />
      <InputTypeFixture type="month" /> <hr />
      <InputTypeFixture type="time" /> <hr />
      <InputTypeFixture type="datetime-local" /> <hr />
    </React.Fragment>
  )
}