import React from 'react';

export default function Spinner(props) {
  let className = 'Spinner';
  if (
    props.size === 'large' ||
    props.size === 'medium'
  ) {
    className += ' Spinner--big';
  }
  let spinner = (
    <div className={className}>
      {'🌀'}
    </div>
  );
  if (props.size === 'medium') {
    spinner = (
      <div style={{
        position: 'relative',
        height: 200
      }}>
        {spinner}
      </div>
    );
  }
  return spinner;
}
