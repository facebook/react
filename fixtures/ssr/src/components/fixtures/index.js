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
    const Fixture = fixtures[fixtureName];
    return (
      <div key={fixtureName} id={fixtureName}>
        <h1 style={{backgroundColor: 'royalblue'}}>{fixtureName}</h1>
        <Fixture />
        <hr />
        <p>
          <a href="#ssr-toc">Back to Table of Contents</a>
        </p>
      </div>
    );
  });
};

const TableOfContents = fixtures => {
  return Object.keys(fixtures).map(fixtureName => {
    return (
      <li key={fixtureName}>
        <a href={`#${fixtureName}`}>{fixtureName}</a>
      </li>
    );
  });
};

class FixturesPage extends React.Component {
  render() {
    const allFixtures = {
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
      AutofocusFixtures,
    };
    return (
      <div>
        <h1 id="ssr-toc">SSR Fixture Table of Contents</h1>
        <ul>{TableOfContents(allFixtures)}</ul>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {FixtureSection(allFixtures)}
        </div>
      </div>
    );
  }
}

export default FixturesPage;
