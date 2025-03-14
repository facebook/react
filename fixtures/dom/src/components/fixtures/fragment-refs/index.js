import FixtureSet from '../../FixtureSet';
import EventListenerCase from './EventListenerCase';
import IntersectionObserverCase from './IntersectionObserverCase';
import ResizeObserverCase from './ResizeObserverCase';

const React = window.React;

export default function FragmentRefsPage() {
  return (
    <FixtureSet title="Fragment Refs">
      <EventListenerCase />
      <IntersectionObserverCase />
      <ResizeObserverCase />
    </FixtureSet>
  );
}
