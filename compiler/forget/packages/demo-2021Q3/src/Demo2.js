import React, { createContext, useRef, useReducer, useContext } from "react";
import "./styles.css";

const initialStore = {
  left: undefined,
  right: undefined,
};

const reducer = (state, action) => {
  switch (action.tag) {
    case "left":
      return { ...state, left: action.payload };
    case "right":
      return { ...state, right: action.payload };
    default:
      return state;
  }
};

const BinaryContext = createContext(initialStore);

function Input({ value, onChange }) {
  return (
    <input
      className="Search"
      placeholder="..."
      value={value}
      onChange={onChange}
    />
  );
}

function Left() {
  const [{ left }, dispatch] = useContext(BinaryContext);
  const rerenderCount = useRef(0);
  return (
    <div className="column Demo2">
      <header className="Header row">
        <div className="Icon">⚛️</div>
        <Input
          value={left}
          onChange={(e) => dispatch({ tag: "left", payload: e.target.value })}
        />
      </header>
      <div className="Feed">
        <h3>{rerenderCount.current++}</h3>
        <div className="FeedItem">{left}</div>
      </div>
    </div>
  );
}

function Right() {
  const [{ right }, dispatch] = useContext(BinaryContext);
  const rerenderCount = useRef(0);
  return (
    <div className="column Demo2">
      <header className="Header row">
        <div className="Icon">⚛️</div>
        <Input
          value={right}
          onChange={(e) => dispatch({ tag: "right", payload: e.target.value })}
        />
      </header>
      <div className="Feed">
        <h3>{rerenderCount.current++}</h3>
        <div className="FeedItem">{right}</div>
      </div>
    </div>
  );
}

export default function Demo2() {
  const [state, dispatch] = useReducer(reducer, initialStore);
  const store = [state, dispatch];
  // const store = React.useMemo(() => [state, dispatch], [state]);

  return (
    <BinaryContext.Provider value={store}>
      <div className="App">
        <h2>Demo2 - Context</h2>
        <div className="row">
          <Left />
          <Right />
        </div>
      </div>
    </BinaryContext.Provider>
  );
}
