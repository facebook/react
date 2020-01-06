import React, { Fragment, useLayoutEffect, useRef } from 'react';
import usePanAndZoom from './usePanAndZoom';

export default function Canvas({
  height,
  renderCanvas,
  renderTooltip,
  scrollWidth,
  width,
}) {
  const canvasRef = useRef();

  const state = usePanAndZoom(canvasRef, scrollWidth);

  useLayoutEffect(() => renderCanvas(canvasRef.current, state));

  return (
    <Fragment>
      <canvas ref={canvasRef} height={height} width={width} />
      {renderTooltip(state)}
      <pre>{`canvas width: ${canvasRef.current ? canvasRef.current.width : '-'}
canvas scrollWidth: ${canvasRef.current ? scrollWidth : '-'}
centerX: ${state.centerX}
zoomLevel: ${state.zoomLevel}
canvasMouseX: ${state.canvasMouseX}
canvasMouseY: ${state.canvasMouseY}
caltulated ts: ${ts}`}</pre>
    </Fragment>
  );
}
