interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

export function RangeSlider({ label, value, min, max, unit, onChange }: RangeSliderProps) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-slate-400">
          {value}
          {unit}
        </span>
      </span>
      <input
        className="w-full accent-sky-500"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
