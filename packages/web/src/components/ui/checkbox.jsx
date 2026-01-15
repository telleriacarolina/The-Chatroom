export function Checkbox({ checked, onCheckedChange, id, className = '' }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      className={`w-5 h-5 min-w-[44px] min-h-[44px] sm:w-6 sm:h-6 rounded border-2 border-chocolate text-kawaii focus:ring-2 focus:ring-kawaii focus:ring-offset-2 focus:ring-offset-burgundy cursor-pointer ${className}`}
    />
  );
}

export default Checkbox;
