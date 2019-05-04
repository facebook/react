import React, { useState } from 'react';
import controlled from '../../hoc/controlled';

const Textarea = (props) => <textarea {...props} />;
const ControlledTextarea = controlled(Textarea);

export default function TextareaFixture() {
  return (
    <React.Fragment>
      <h2>React SSR Textarea</h2>
      <div>
        <div>Textarea uncontrolled</div>
        <textarea />
      </div>
      <div>
        <div>Textarea controlled</div>
        <ControlledTextarea />
      </div>
      <hr />
    </React.Fragment>
  )
}