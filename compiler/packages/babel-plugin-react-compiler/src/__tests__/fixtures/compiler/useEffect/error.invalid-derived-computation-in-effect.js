// @validateNoDerivedComputationsInEffects
function BadExample() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(capitalize(firstName + ' ' + lastName));
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}
