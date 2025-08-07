
## Input

```javascript
// @compilationMode:"infer"
class Component {
  _renderMessage = () => {
    const Message = () => {
      const message = this.state.message;
      return <div>{message}</div>;
    };
    return <Message />;
  };

  render() {
    return this._renderMessage();
  }
}

```

## Code

```javascript
// @compilationMode:"infer"
class Component {
  _renderMessage = () => {
    const Message = () => {
      const message = this.state.message;
      return <div>{message}</div>;
    };
    return <Message />;
  };

  render() {
    return this._renderMessage();
  }
}

```
      