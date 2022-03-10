// You can use React.Children to iterate over the children, and then clone each element with new props (shallow merged) using React.cloneElement. For example:

const Child = ({ doSomething, value }) => (
    <button onClick={() => doSomething(value)}>Click Me</button>
  );
  
  function Parent({ children }) {
    function doSomething(value) {
      console.log("doSomething called by child with value:", value);
    }
  
    const childrenWithProps = React.Children.map(children, child => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { doSomething });
      }
      return child;
    });
  
    return <div>{childrenWithProps}</div>
  }
  
  function App() {
    return (
      <Parent>
        <Child value={1} />
        <Child value={2} />
      </Parent>
    );
  }
  
  ReactDOM.render(<App />, document.getElementById("container"));
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
  <div id="container"></div>