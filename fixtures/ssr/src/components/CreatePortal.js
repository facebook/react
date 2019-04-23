import React from 'react';
import ReactDom from 'react-dom';

export default class CreatePortal extends React.Component {
  render() {
    if (typeof document === 'undefined') {
      return null;
    }
    const root = document.body;
    return ReactDom.createPortal(<div>Hello Portal</div>, root);
  }
}
