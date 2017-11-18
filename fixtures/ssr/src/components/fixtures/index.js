import RangeInputFixtures from './range-inputs';
import TextInputFixtures from './text-inputs';
import SelectFixtures from './selects';
import TextAreaFixtures from './textareas';
import InputChangeEvents from './input-change-events';
import NumberInputFixtures from './number-inputs';
import PasswordInputFixtures from './password-inputs';
import ButtonFixtures from './buttons';
import DateInputFixtures from './date-inputs';
import ErrorHandling from './error-handling';
import EventPooling from './event-pooling';
import CustomElementFixtures from './custom-elements';
import AutofocusFixtures from './autofocus';
import BasicFormElementsFixtures from './basic-form-elements';

import React from 'react';

const FixtureSection = fixtures => {
  return Object.keys(fixtures).map(fixtureName => {
    const Fixture = fixtures[fixtureName]
    return(
    <div key={fixtureName}>
      <h1 style={{backgroundColor: 'royalblue'}}>{fixtureName}</h1>
      <Fixture />
      <hr />
    </div>
  )})
}

class FixturesPage extends React.Component {
  render() {
    return (
      <div style={{display: "flex", flexDirection: "column"}}>
        {FixtureSection({
          BasicFormElementsFixtures,
          TextInputFixtures,
          RangeInputFixtures,
          SelectFixtures,
          TextAreaFixtures,
          InputChangeEvents,
          NumberInputFixtures,
          PasswordInputFixtures,
          ButtonFixtures,
          DateInputFixtures,
          ErrorHandling,
          EventPooling,
          CustomElementFixtures,
          AutofocusFixtures
        })}
      </div>
    )
  }
}

export default FixturesPage;
