const exportToCSV = () => {
  const header = ["Permit Number", "Date", "Vehicle", "Destination", "Brand", "Size", "Quantity"];
  let rows = [];

  permits.forEach(permit => {
    permit.brands.forEach(brand => {
      brand.quantities.forEach(q => {
        rows.push([
          permit.permitNumber,
          permit.date,
          permit.vehicleNumber,
          permit.destination,
          brand.name,
          q.size,
          q.quantity
        ]);
      });
    });
  });

  const csvContent = [
    header.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "IMFL_Transport_Permits.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
