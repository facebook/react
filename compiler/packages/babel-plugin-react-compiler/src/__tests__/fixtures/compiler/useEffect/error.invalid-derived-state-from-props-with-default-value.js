// @validateNoDerivedComputationsInEffects

export default function InProductLobbyGeminiCard(
  input = 'empty',
) {
  const [currInput, setCurrInput] = useState(input);

  useEffect(() => {
    setCurrInput(input)
  }, [input]);

  return (
    <div>{currInput}</div>
  )
}
