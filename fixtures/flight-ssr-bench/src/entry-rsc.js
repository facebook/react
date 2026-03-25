import {renderToPipeableStream} from 'react-server-dom-webpack/server';
import App from './App';
import AppAsync from './AppAsync';

export default function renderRSC(clientManifest, Component, itemCount) {
  return renderToPipeableStream(
    <Component itemCount={itemCount} />,
    clientManifest
  );
}

export {App, AppAsync};
