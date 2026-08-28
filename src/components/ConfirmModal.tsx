import React from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmação genérico para ações destrutivas (ex: excluir cliente/fábrica).
 * Reaproveita as classes de modal já usadas no restante do sistema.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirming = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: "460px" }}>
        <div className="modal-header">
          <h2><FaExclamationTriangle className="modal-title-icon" style={{ color: "var(--color-danger)" }} /> {title}</h2>
          <button className="modal-close" onClick={onCancel}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--color-text)", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={confirming}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={confirming}>
            {confirming ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
