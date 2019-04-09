import React from "react";
import { createPortal } from "react-dom";
import Component from "@reach/component-component";

let Portal = ({ children, type = "reach-portal" }) => (
  <Component
    getRefs={() => ({ mountNode: null, portalNode: null })}
    didMount={({ refs, forceUpdate }) => {
      // It's possible that the content we are portal has, itself, been portaled.
      // In that case, it's important to append to the correct document element.
      const ownerDocument = refs.mountNode.ownerDocument;
      refs.portalNode = ownerDocument.createElement(type);
      ownerDocument.body.appendChild(refs.portalNode);
      forceUpdate();
    }}
    willUnmount={({ refs: { portalNode } }) => {
      portalNode.ownerDocument.body.removeChild(portalNode);
    }}
    render={({ refs }) => {
      const { portalNode } = refs;
      if (!portalNode) {
        return <div ref={div => (refs.mountNode = div)} />;
      } else {
        return createPortal(children, portalNode);
      }
    }}
  />
);

export default Portal;
