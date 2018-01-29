import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import Iframe from '../../Iframe';
import ReorderedInputsTestCase from './ReorderedInputsTestCase';
import DraftJsEditorTestCase from './DraftJsEditorTestCase';
const React = window.React;


export default function SelectionEvents() {
  return (
    <FixtureSet
      title="Selection Restoration in iframes"
      description="
      When React commits changes it may perform operations which cause existing
      selection state to be lost. This is manually managed by reading the
      selection state before commits and then restoring it afterwards.
      This selection restoration process should work for elements rendered in
      iframes.
      ">
      <ReorderedInputsTestCase />
      <DraftJsEditorTestCase />
    </FixtureSet>
  );
};
