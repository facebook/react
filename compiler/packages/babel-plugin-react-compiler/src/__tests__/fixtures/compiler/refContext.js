import { createContext, useContext, useRef, useEffect } from 'react';

export const MyContext = createContext({
  exampleRef: { current: null }
});

export default function ParentComponent() {
  const exampleRef = useRef('No');

  return (
    <>
      <MyContext.Provider value={{ exampleRef }}>
        <ChildComponent />
      </MyContext.Provider>
    </>
  );
}

function ChildComponent() {
  const { exampleRef } = useContext(MyContext);

  useEffect(() => {
    exampleRef.current = 'Yes';
  }, [exampleRef]);
  
  return <div />;
}

function ChildComponentEvent() {
  const { exampleRef } = useContext(MyContext);

  return <div onClick={() => {
    exampleRef.current = 'Yes';
  }} />;
} 