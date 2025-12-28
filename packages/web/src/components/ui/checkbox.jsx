export function Checkbox({ checked, onCheckedChange, id }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
    />
  );
}

export default Checkbox;
