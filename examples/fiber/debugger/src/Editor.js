import React, { Component } from 'react';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: props.code
    };
  }

  render() {
    return (
      <div style={{
        height: '100%',
        width: '100%'
      }}>
        <textarea
          value={this.state.code}
          onChange={e => this.setState({ code: e.target.value })}
          style={{
            height: '80%',
            width: '100%',
            fontSize: '15px'
          }} />
        <div style={{ height: '20%', textAlign: 'center' }}>
          <button onClick={() => this.props.onClose(this.state.code)} style={{ fontSize: 'large' }}>
            Run
          </button>
        </div>
      </div>
    )
  }
}

export default Editor;
