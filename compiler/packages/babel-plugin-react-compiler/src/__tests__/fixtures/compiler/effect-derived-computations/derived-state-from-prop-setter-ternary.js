// @validateNoDerivedComputationsInEffects_exp

function Component({value}) {
  const [checked, setChecked] = useState('');

  useEffect(() => {
    setChecked(value === '' ? [] : value.split(','));
  }, [value]);

  return <div>{checked}</div>;
}
