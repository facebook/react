import React, { useState } from 'react';

function ControlledInputRadio(props) {
  const { name } = props;

  const [value, setValue] = useState('');

  return (
    <React.Fragment>
      <input type="radio" name={name} value={1} onChange={(e) => setValue(e.target.value)} /> Option 1 <br />
      <input type="radio" name={name} value={2} onChange={(e) => setValue(e.target.value)} /> Option 2 <br />
      <input type="radio" name={name} value={3} onChange={(e) => setValue(e.target.value)} /> Option 3 <br />
      <span>Controlled value: {value}</span>
    </React.Fragment>
  );
}

export default function InputCheckboxFixture() {
  return (
    <React.Fragment>
      <h3>Input type="radio"</h3>
      <div>
        <div>Input type="radio" uncontrolled</div>
        <input type="radio" name="option" value={1} /> Option 1 <br />
        <input type="radio" name="option" value={2} /> Option 2 <br />
        <input type="radio" name="option" value={3} /> Option 3 <br />
      </div>
      <div>
        <div>Input type="radio" controlled</div>
        <ControlledInputRadio name="option" />
      </div>
      <hr />
    </React.Fragment>
  )
}