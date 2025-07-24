import React from 'react';

export function getInput(a) {
  const Wrapper = () => {
    const handleChange = () => {
      a.onChange();
    };


    return (
      <input
        onChange={handleChange}
      >
      </input>
    );
  };

  return Wrapper
}