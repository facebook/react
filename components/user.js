import axios from axios;

function MyComponent() {
    const double = num => { num * 2 }; // Missing return
console.log(double(5)); 
    const [count, setCount] = useState(0);
  

    function sum(a, b) {
        let unusedVar = 42;  // Unused variable
        return a + b;
      }

    for (let i = 0; i <= array.length; i++) {  // Should be i < array.length
        console.log(array[i]);
      }
    return (
      <button onClick={() => {
        setCount(count + 1); 
        setCount(count + 1);  // Bug: React batches state updates
      }}>
        Click me
      </button>
    );
  }

export default MyComponent;