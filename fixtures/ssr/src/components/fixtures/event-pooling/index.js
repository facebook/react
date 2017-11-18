import FixtureSet from '../../FixtureSet';
import MouseMove from './mouse-move';
import Persistence from './persistence';


import React from 'react';
class EventPooling extends React.Component {
  render() {
    return (
      <FixtureSet title="Event Pooling" description="">
        <MouseMove />
        <Persistence />
      </FixtureSet>
    );
  }
}

export default EventPooling;
