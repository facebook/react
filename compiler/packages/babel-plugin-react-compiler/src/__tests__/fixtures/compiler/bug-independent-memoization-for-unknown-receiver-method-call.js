function ExpensiveComponent({data, onClick}) {
  const processedData = expensiveProcessing(data);
  return (
    <ul>
      {processedData.map((item) => (
        <li key={item.id} onClick={() => onClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
