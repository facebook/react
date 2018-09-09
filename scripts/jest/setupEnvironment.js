/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  throw new Error('NODE_ENV must either be set to development or production.');
}
global.__DEV__ = NODE_ENV === 'development';
global.__PROFILE__ = NODE_ENV === 'development';
global.__UMD__ = false;

if (typeof window !== 'undefined') {
  global.requestAnimationFrame = function(callback) {
    setTimeout(callback);
  };

  global.requestIdleCallback = function(callback) {
    return setTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
      });
    });
  };

  global.cancelIdleCallback = function(callbackID) {
    clearTimeout(callbackID);
  };

  window.SVGElement.prototype.getBBox = function () {
    return {};
  }

  window.HTMLCanvasElement.prototype.getContext = function () {
    let dummyProps = [
      'rect', 'fillRect', 'clearRect', 'drawImage', 'save', 'restore', 'fillText',
      'beginPath', 'moveTo', 'lineTo', 'closePath', 'translate', 'scale', 'rotate',
      'arc', 'fill', 'stroke', 'clip', 'transform', 'setTransform'
    ];

    let contextMap = {};
    for (let prop of dummyProps) {
      contextMap[prop] = () => {};
    }

    return {
      ...contextMap,
      measureText: () => {
        return {
          width: 0
        };
      },
      getImageData: (x, y, w, h) => {
        return {
          data: new Array(w * h * 4)
        };
      },
      putImageData: () => {},
      createImageData: () => {
        return [];
      },
    };
  }
}
