import React, { Component } from 'react';

import './Page.css';

export default class Page extends Component {
  state = { active: false };
  handleClick = (e) => {
    this.setState({ active: true });
  }
  render() {
    const link = (
      <a className="bold" onClick={this.handleClick}>
        Click Here
      </a>
    );
    return (
      <div>
        <p>
          {!this.state.active ? link : "Thanks!"}
        </p>
      </div>
    );
  }
}
