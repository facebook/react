import React, { useState } from 'react';

function ControlledInputCheckbox(props) {
  const [value, setValue] = useState();

  return (
    <React.Fragment>
      <input 
        type="checkbox"
        value="checkbox value"
        onChange={(e) => setValue(e.target.checked ? e.target.value : e.target.checked)}
      />
      <span>Controlled value: {value}</span>
    </React.Fragment>
  );
}

export default function InputCheckboxFixture() {
  return (
    <React.Fragment>
      <h3>Input type="checkbox"</h3>
      <div>
        <div>Input type="checkbox" uncontrolled</div>
        <input type="checkbox" />
      </div>
      <div>
        <div>Input type="checkbox" controlled</div>
        <ControlledInputCheckbox />
      </div>
      <hr />
    </React.Fragment>
  )
}