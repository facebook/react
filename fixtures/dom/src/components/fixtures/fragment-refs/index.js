import FixtureSet from '../../FixtureSet';
import EventListenerCase from './EventListenerCase';
import IntersectionObserverCase from './IntersectionObserverCase';
import ResizeObserverCase from './ResizeObserverCase';
import FocusCase from './FocusCase';

const React = window.React;

export default function FragmentRefsPage() {
  return (
    <FixtureSet title="Fragment Refs">
      <EventListenerCase />
      <IntersectionObserverCase />
      <ResizeObserverCase />
      <FocusCase />
    </FixtureSet>
  );
}
