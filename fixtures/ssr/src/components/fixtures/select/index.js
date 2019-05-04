import React from 'react';
import controlled from '../../hoc/controlled';

const Select = (props) => <select {...props} />;
const ControlledSelect = controlled(Select);

const ControlledMultipleSelect = controlled(
  Select, 
  (e, updateState) => updateState([...e.target.options]
    .filter(option => option.selected)
    .map(option => option.value)
  ),
  []
);

export default function SelectFixture() {
  const options = [1,2,3].map((n) => <option value={n}>{`Option ${n}`}</option>);

  return (
    <React.Fragment>
      <h2>React SSR Select</h2>
      <div>
        <div>
          <label>Select uncontrolled</label>
          <Select children={options} />
        </div>
        <div>
          <label>Select controlled</label>
          <ControlledSelect children={options} />
        </div>
      </div>
      <div>
        <div>Select type="multiple" uncontrolled</div>
        <Select multiple children={options} />
      </div>
      <div>
        <div>Select type="multiple" controlled</div>
        <ControlledMultipleSelect multiple children={options} />
      </div>
      <hr />
    </React.Fragment>
  )
}