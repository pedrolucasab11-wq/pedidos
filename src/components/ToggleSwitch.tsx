import React from "react";
import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Toggle switch acessível para alternar entre dois estados (ex: Ativo/Inativo).
 * Verde = ativo, cinza = inativo. Suporta navegação por teclado e leitores de tela.
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  labelOn = "Ativa",
  labelOff = "Inativa",
  disabled = false,
  id,
}) => {
  return (
    <div className="toggle-switch-wrapper">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={checked ? labelOn : labelOff}
        disabled={disabled}
        className={`toggle-switch ${checked ? "toggle-switch-on" : "toggle-switch-off"}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-switch-knob" />
      </button>
      <span className={`toggle-switch-label ${checked ? "label-on" : "label-off"}`}>
        {checked ? labelOn : labelOff}
      </span>
    </div>
  );
};

export default ToggleSwitch;
