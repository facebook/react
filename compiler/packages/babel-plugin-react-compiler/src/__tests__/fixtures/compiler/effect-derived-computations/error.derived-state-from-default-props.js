// @validateNoDerivedComputationsInEffects

export default function Component(input = 'empty') {
  const [currInput, setCurrInput] = useState(input);

  useEffect(() => {
    setCurrInput(input);
  }, [input]);

  return <div>{currInput}</div>;
}
