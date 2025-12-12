import React from 'react';

const base = 'div';

const TestComponent: React.FC = () => {
  const Comp = base;
  return <Comp />;
};

export default function Home() {
  return <TestComponent />;
}
