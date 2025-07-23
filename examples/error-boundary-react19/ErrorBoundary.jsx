import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error) {
    // Update state so fallback UI will render
    return {hasError: true};
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an external service here
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render any fallback UI you like
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
