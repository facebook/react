// @validateNoDerivedComputationsInEffects_exp @enableTreatSetIdentifiersAsStateSetters @loggerTestOnly

function Component({setParentState, prop}) {
  useEffect(() => {
    setParentState(prop);
  }, [prop]);

  return <div>{prop}</div>;
}
