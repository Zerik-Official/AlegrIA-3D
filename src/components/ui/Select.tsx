import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * A single option in the {@link Select} dropdown.
 */
export interface SelectOption {
  /** Internal value sent to the parent state when selected. */
  value: string;
  /** Label shown to the user in the dropdown list. */
  label: string;
  /** Optional image shown alongside the label, such as a game or server logo. */
  thumb?: string | ReactNode;
}

/**
 * Properties for the {@link Select} component.
 */
interface SelectProps {
  /** Currently selected value. */
  value: string;
  /** List of options displayed in the dropdown menu. */
  options: SelectOption[];
  /** Callback fired when a different option is selected. */
  onChange: (value: string) => void;
  /** Text shown when no option is currently selected. @default "Seleccionar" */
  placeholder?: string;
}

/**
 * Themed dropdown used instead of a native `<select>`.
 *
 * Native option popups can't be reliably restyled across platforms, so this
 * renders its own listbox and supports an optional thumbnail per option.
 *
 * @example
 * ```tsx
 * <Select
 *   value={selectedRegion}
 *   options={regions}
 *   onChange={setSelectedRegion}
 *   placeholder="Seleccionar región"
 * />
 * ```
 */
export function Select({ value, options, onChange, placeholder = "Seleccionar" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value);

  function renderThumb(thumb: string | ReactNode | undefined) {
    if (!thumb) return null;
    if (typeof thumb === "string") return <img src={thumb} alt="" className="h-4.5 w-6 shrink-0 rounded-[3px] object-cover" />;
    return <span className="flex h-4.5 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-sm">{thumb}</span>;
  }

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md bg-white/10 px-2 py-1.5 text-left text-[11px] text-parchment outline-none transition-colors hover:bg-white/15 focus-visible:bg-white/15"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {renderThumb(selected?.thumb)}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <FiChevronDown className={`h-3 w-3 shrink-0 opacity-60 transition-transform${open ? " rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-50 flex max-h-64 flex-col gap-px overflow-y-auto rounded-lg border border-gold/20 bg-[#0d1326] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                option.value === value ? "bg-gold/15 text-gold" : "text-parchment/80 hover:bg-white/10"
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {renderThumb(option.thumb)}
              <span className="truncate">{option.label}</span>
              {option.value === value ? <FiCheck className="ml-auto h-3 w-3 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}