import React, { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./normalize.css";
import "./styles.css";
import "./plain.css";
import "./neo.css";

import Ch1 from "./source/Ch1";
import Ch2 from "./source/Ch2";
import Ch3 from "./source/Ch3";
import Ch4 from "./source/Ch4";
import Ch5 from "./source/Ch5";
import Ch1Memo from "./source/Ch1.memo";
import Ch2HalfMemo from "./source/Ch2.half.memo";
import Ch2Memo from "./source/Ch2.memo";
import Ch1Forget from "./forget/Ch1";
import Ch2Forget from "./forget/Ch2";
import Ch3Forget from "./forget/Ch3";
import Ch4Forget from "./forget/Ch4";
import Ch5Forget from "./forget/Ch5";
import Neo0 from "./source/Neo0";
import Neo1 from "./source/Neo1";
import Neo1Memo from "./source/Neo1.memo";
import Neo1Forget from "./forget/Neo1";
import Neo2 from "./source/Neo2";
import Neo2HalfMemo from "./source/Neo2.half.memo";
import Neo2Forget from "./forget/Neo2";
import Neo3 from "./source/Neo3";
import Neo3HalfMemo from "./source/Neo3.half.memo";
import Neo3Memo from "./source/Neo3.memo";
import Neo3Forget from "./forget/Neo3";

const apps = {
  Neo0,
  Neo1,
  Neo1Memo,
  Neo1Forget,
  Neo2,
  Neo2HalfMemo,
  Neo2Forget,
  Neo3,
  Neo3HalfMemo,
  Neo3Memo,
  Neo3Forget,
  Ch1,
  Ch1Memo,
  Ch1Forget,
  Ch2,
  Ch2HalfMemo,
  Ch2Memo,
  Ch2Forget,
  Ch3,
  Ch3Forget,
  Ch4,
  Ch4Forget,
  Ch5,
  Ch5Forget,
};

let lastApps;
try {
  lastApps = JSON.parse(localStorage.getItem("apps"));
} catch {
  localStorage.removeItem("apps");
}
const defaultApps = lastApps || ["Neo1", "Ch1"];

function Dynamic({ appName, index, onChangeApp, onDelete }) {
  const [curAppName, setCurAppName] = useState(appName);
  const App = apps[curAppName];
  const app = App ? (
    <div className={curAppName?.startsWith("Neo") ? "Neo" : "Plain"}>
      <App />
    </div>
  ) : (
    <div className="Plain"> Wrong Value </div>
  );
  const onChange = e => {
    setCurAppName(e.target.value);
    onChangeApp(e.target.value, index);
  };

  return (
    <div>
      <select value={curAppName} onChange={onChange}>
        {Object.keys(apps).map(appName => (
          <option key={appName} value={appName}>
            {appName}
          </option>
        ))}
      </select>
      <button onClick={() => onDelete(index)}> Remove </button>
      {app}
    </div>
  );
}

function Root() {
  const [apps, setApps] = useState(defaultApps);
  const [count, setCount] = useState(0);
  const [zoom, setZoom] = useState(false);
  const handleAdd = () => setApps([...apps, "Neo1"]);
  const handleRerender = () => setCount(count + 1);

  const onChangeApp = (app, index) =>
    setApps(apps => apps.map((a, i) => (index === i ? app : a)));

  const onDelete = index => setApps(apps => apps.filter((_, i) => index !== i));

  const onZoomChange = e => setZoom(e.target.checked);

  const zoomStyle = zoom
    ? {
        transform: "scale(1.5)",
        transformOrigin: "top",
      }
    : {};

  useEffect(() => {
    localStorage.setItem("apps", JSON.stringify(apps));
  }, [apps]);

  return (
    <>
      <h2 style={{ color: "#fffd" }}> ⚛️ Forget Playground </h2>
      <button onClick={handleAdd}> Add Into Comparison </button>
      <button onClick={handleRerender}>Rerender Root: #{count}</button>
      <label style={{ color: "#fffd" }}>
        <input type="checkbox" checked={zoom} onChange={onZoomChange} />
        Zoom For Recording
      </label>
      <div className="row" style={zoomStyle}>
        {apps.map((app, index) => (
          <div key={index} className="column">
            <Dynamic
              appName={app}
              index={index}
              onChangeApp={onChangeApp}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <Root />
  </StrictMode>,
  rootElement
);
