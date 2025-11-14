// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

function Component({prop}) {
  const [s, setS] = useState(0);
  useEffect(() => {
    setS(prop);
  }, [prop, setS]);

  return <div>{prop}</div>;
}
