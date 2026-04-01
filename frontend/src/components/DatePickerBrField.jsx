import { useRef } from "react";
import { dateApiToBr, dateBrToApi, maskDateBrInput } from "../utils/format";

/**
 * Data em dd/mm/aaaa com máscara na digitação e botão para o calendário nativo do navegador.
 */
export function DatePickerBrField({ label, value, onChange, disabled }) {
  const dateInputRef = useRef(null);
  const iso = dateBrToApi(value ?? "") ?? "";

  const openPicker = () => {
    const el = dateInputRef.current;
    if (el && typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el?.click();
    }
  };

  return (
    <label className="date-picker-br-field">
      {label}
      <div className="date-picker-br-row">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={value ?? ""}
          onChange={(e) => onChange(maskDateBrInput(e.target.value))}
          disabled={disabled}
        />
        <button
          type="button"
          className="date-picker-br-calendar-btn"
          onClick={openPicker}
          disabled={disabled}
          aria-label="Abrir calendário"
          title="Calendário"
        >
          📅
        </button>
        <input
          ref={dateInputRef}
          type="date"
          className="date-picker-br-native"
          tabIndex={-1}
          aria-hidden
          value={iso}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v ? dateApiToBr(v) : "");
          }}
        />
      </div>
    </label>
  );
}
