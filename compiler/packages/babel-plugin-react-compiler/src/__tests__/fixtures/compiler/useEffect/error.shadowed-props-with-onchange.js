// @validateNoDerivedComputationsInEffects

function EndDate({startDate, endDate, onStartDateChange}) {
  const [localStartDate, setLocalStartDate] = useState(startDate);

  useEffect(() => {
    setLocalStartDate(startDate);
  }, [startDate]);

  const onChange = date => {
    setLocalStartDate(date);
    onStartDateChange(date);
  };
  return (
    <DateInput value={localStartDate} second={endDate} onChange={onChange} />
  );
}
