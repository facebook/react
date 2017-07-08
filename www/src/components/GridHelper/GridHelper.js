import React from 'react';

const GridHelper = () =>
  <div>
    <span className="design-grid design-grid--baseline" />

    <span className="design-grid design-grid--columns">
      <div className="wrapper">
        <div className="grid">
          {[0, 1, 2, 3, 4, 5].map(i =>
            <div key={i}>
              <div />
            </div>
          )}
        </div>
      </div>
    </span>
  </div>;

export default GridHelper;
