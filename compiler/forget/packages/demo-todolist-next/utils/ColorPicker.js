export default function ColorPicker({ value, onChange }) {
  return (
    <input
      className="ColorPicker"
      type="color"
      id="head"
      name="head"
      value={value}
      onChange={onChange}
    />
  );
}
