// @flow

import assign from 'object-assign';

type Rect = {
  bottom: number,
  height: number,
  left: number,
  right: number,
  top: number,
  width: number,
};

// Note that this component is not affected by the active Theme,
// because it highlights elements in the main Chrome window (outside of devtools).
// The colors below were chosen to roughly match those used by Chrome devtools.
export default class Overlay {
  window: window;
  container: HTMLElement;
  node: HTMLElement;
  border: HTMLElement;
  padding: HTMLElement;
  content: HTMLElement;
  tip: HTMLElement;
  nameSpan: HTMLElement;
  dimSpan: HTMLElement;

  constructor() {
    // Find the root window, because overlays are positioned relative to it.
    let currentWindow = window;
    while (currentWindow !== currentWindow.parent) {
      currentWindow = currentWindow.parent;
    }

    const doc = currentWindow.document;
    this.window = currentWindow;
    this.container = doc.createElement('div');
    this.node = doc.createElement('div');
    this.border = doc.createElement('div');
    this.padding = doc.createElement('div');
    this.content = doc.createElement('div');

    this.border.style.borderColor = overlayStyles.border;
    this.padding.style.borderColor = overlayStyles.padding;
    this.content.style.backgroundColor = overlayStyles.background;

    assign(this.node.style, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    });

    this.tip = doc.createElement('div');
    assign(this.tip.style, {
      backgroundColor: '#333740',
      borderRadius: '2px',
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontWeight: 'bold',
      padding: '3px 5px',
      position: 'fixed',
      fontSize: '12px',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);
    assign(this.nameSpan.style, {
      color: '#ee78e6',
      borderRight: '1px solid #aaaaaa',
      paddingRight: '0.5rem',
      marginRight: '0.5rem',
    });
    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);
    assign(this.dimSpan.style, {
      color: '#d7d7d7',
    });

    this.container.style.zIndex = '10000000';
    this.node.style.zIndex = '10000000';
    this.tip.style.zIndex = '10000000';
    this.container.appendChild(this.node);
    this.container.appendChild(this.tip);
    this.node.appendChild(this.border);
    this.border.appendChild(this.padding);
    this.padding.appendChild(this.content);
    doc.body.appendChild(this.container);
  }

  remove() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  inspect(node: HTMLElement, name?: ?string) {
    // We can't get the size of text nodes or comment nodes. React as of v15
    // heavily uses comment nodes to delimit text.
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const box = getNestedBoundingClientRect(node, this.window);
    const dims = getElementDimensions(node);

    boxWrap(dims, 'margin', this.node);
    boxWrap(dims, 'border', this.border);
    boxWrap(dims, 'padding', this.padding);

    assign(this.content.style, {
      height:
        box.height -
        dims.borderTop -
        dims.borderBottom -
        dims.paddingTop -
        dims.paddingBottom +
        'px',
      width:
        box.width -
        dims.borderLeft -
        dims.borderRight -
        dims.paddingLeft -
        dims.paddingRight +
        'px',
    });

    assign(this.node.style, {
      top: box.top - dims.marginTop + 'px',
      left: box.left - dims.marginLeft + 'px',
    });

    if (!name) {
      name = node.nodeName.toLowerCase();
      const ownerName = getOwnerDisplayName(node);
      if (ownerName) {
        name += ' (in ' + ownerName + ')';
      }
    }

    this.nameSpan.textContent = name;
    this.dimSpan.textContent =
      Math.round(box.width) + 'px × ' + Math.round(box.height) + 'px';

    const tipPos = findTipPos(
      {
        top: box.top - dims.marginTop,
        left: box.left - dims.marginLeft,
        height: box.height + dims.marginTop + dims.marginBottom,
        width: box.width + dims.marginLeft + dims.marginRight,
      },
      this.window
    );
    assign(this.tip.style, tipPos);
  }
}

function getOwnerDisplayName(node) {
  const fiber = getFiber(node);
  if (fiber === null) {
    return null;
  }
  const owner = fiber._debugOwner;
  if (owner && owner.type) {
    const ownerName = owner.type.displayName || owner.type.name;
    return ownerName || null;
  }
  return null;
}

let lastFoundInternalKey = null;
function getFiber(node) {
  if (
    lastFoundInternalKey !== null &&
    node.hasOwnProperty(lastFoundInternalKey)
  ) {
    return (node: any)[lastFoundInternalKey];
  }
  let internalKey = Object.keys(node).find(
    key => key.indexOf('__reactInternalInstance') === 0
  );
  if (internalKey) {
    lastFoundInternalKey = internalKey;
    return (node: any)[lastFoundInternalKey];
  }
  return null;
}

function findTipPos(dims, win) {
  const tipHeight = 20;
  const margin = 5;
  let top;
  if (dims.top + dims.height + tipHeight <= win.innerHeight) {
    if (dims.top + dims.height < 0) {
      top = margin;
    } else {
      top = dims.top + dims.height + margin;
    }
  } else if (dims.top - tipHeight <= win.innerHeight) {
    if (dims.top - tipHeight - margin < margin) {
      top = margin;
    } else {
      top = dims.top - tipHeight - margin;
    }
  } else {
    top = win.innerHeight - tipHeight - margin;
  }

  top += 'px';

  if (dims.left < 0) {
    return { top, left: margin };
  }
  if (dims.left + 200 > win.innerWidth) {
    return { top, right: margin };
  }
  return { top, left: dims.left + margin + 'px' };
}

export function getElementDimensions(domElement: Element) {
  const calculatedStyle = window.getComputedStyle(domElement);
  return {
    borderLeft: parseInt(calculatedStyle.borderLeftWidth, 10),
    borderRight: parseInt(calculatedStyle.borderRightWidth, 10),
    borderTop: parseInt(calculatedStyle.borderTopWidth, 10),
    borderBottom: parseInt(calculatedStyle.borderBottomWidth, 10),
    marginLeft: parseInt(calculatedStyle.marginLeft, 10),
    marginRight: parseInt(calculatedStyle.marginRight, 10),
    marginTop: parseInt(calculatedStyle.marginTop, 10),
    marginBottom: parseInt(calculatedStyle.marginBottom, 10),
    paddingLeft: parseInt(calculatedStyle.paddingLeft, 10),
    paddingRight: parseInt(calculatedStyle.paddingRight, 10),
    paddingTop: parseInt(calculatedStyle.paddingTop, 10),
    paddingBottom: parseInt(calculatedStyle.paddingBottom, 10),
  };
}

// Get the window object for the document that a node belongs to,
// or return null if it cannot be found (node not attached to DOM,
// etc).
function getOwnerWindow(node: HTMLElement): typeof window | null {
  if (!node.ownerDocument) {
    return null;
  }
  return node.ownerDocument.defaultView;
}

// Get the iframe containing a node, or return null if it cannot
// be found (node not within iframe, etc).
function getOwnerIframe(node: HTMLElement): HTMLElement | null {
  const nodeWindow = getOwnerWindow(node);
  if (nodeWindow) {
    return nodeWindow.frameElement;
  }
  return null;
}

// Get a bounding client rect for a node, with an
// offset added to compensate for its border.
function getBoundingClientRectWithBorderOffset(node: HTMLElement) {
  const dimensions = getElementDimensions(node);
  return mergeRectOffsets([
    node.getBoundingClientRect(),
    {
      top: dimensions.borderTop,
      left: dimensions.borderLeft,
      bottom: dimensions.borderBottom,
      right: dimensions.borderRight,
      // This width and height won't get used by mergeRectOffsets (since this
      // is not the first rect in the array), but we set them so that this
      // object typechecks as a ClientRect.
      width: 0,
      height: 0,
    },
  ]);
}

// Add together the top, left, bottom, and right properties of
// each ClientRect, but keep the width and height of the first one.
function mergeRectOffsets(rects: Array<Rect>): Rect {
  return rects.reduce((previousRect, rect) => {
    if (previousRect == null) {
      return rect;
    }

    return {
      top: previousRect.top + rect.top,
      left: previousRect.left + rect.left,
      width: previousRect.width,
      height: previousRect.height,
      bottom: previousRect.bottom + rect.bottom,
      right: previousRect.right + rect.right,
    };
  });
}

// Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.
function getNestedBoundingClientRect(
  node: HTMLElement,
  boundaryWindow: typeof window
): Rect {
  const ownerIframe = getOwnerIframe(node);
  if (ownerIframe && ownerIframe !== boundaryWindow) {
    const rects = [node.getBoundingClientRect()];
    let currentIframe = ownerIframe;
    let onlyOneMore = false;
    while (currentIframe) {
      const rect = getBoundingClientRectWithBorderOffset(currentIframe);
      rects.push(rect);
      currentIframe = getOwnerIframe(currentIframe);

      if (onlyOneMore) {
        break;
      }
      // We don't want to calculate iframe offsets upwards beyond
      // the iframe containing the boundaryWindow, but we
      // need to calculate the offset relative to the boundaryWindow.
      if (currentIframe && getOwnerWindow(currentIframe) === boundaryWindow) {
        onlyOneMore = true;
      }
    }

    return mergeRectOffsets(rects);
  } else {
    return node.getBoundingClientRect();
  }
}

function boxWrap(dims, what, node) {
  assign(node.style, {
    borderTopWidth: dims[what + 'Top'] + 'px',
    borderLeftWidth: dims[what + 'Left'] + 'px',
    borderRightWidth: dims[what + 'Right'] + 'px',
    borderBottomWidth: dims[what + 'Bottom'] + 'px',
    borderStyle: 'solid',
  });
}

const overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};
