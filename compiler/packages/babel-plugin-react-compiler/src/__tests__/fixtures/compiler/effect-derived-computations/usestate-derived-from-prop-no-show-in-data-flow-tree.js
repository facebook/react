// @validateNoDerivedComputationsInEffects_exp

function Component({ prop }) {
  const [s, setS] = useState(prop)
  const [second, setSecond] = useState(prop)

  useEffect(() => {
    setS(second)
  }, [second])

  return <div>{s}</div>
}
