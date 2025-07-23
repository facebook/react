import React from 'react';

function BuggyComponent() {
  throw new Error('This component crashed!');
}

export default BuggyComponent;
