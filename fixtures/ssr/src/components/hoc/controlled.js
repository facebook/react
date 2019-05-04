import React, { useState } from 'react';

export default function controlled(WrappedComponent, handleChange, initState='') {
  return (props) => {
    const [value, setValue] = useState(initState);

    if (!handleChange) 
      handleChange = (e, updateState) => updateState(e.target.value);

    return (
      <React.Fragment>
        <WrappedComponent
          {...props}
          value={value || props.value}
          onChange={(e) => handleChange(e, setValue)}
        />
        <span>Controlled value: {[].concat(value).join(',')}</span>
      </React.Fragment>
    );
  }
}