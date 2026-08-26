import React, { useEffect, useState } from "react";
import { FaEnvelope, FaTimes, FaPaperPlane, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import api from "../services/api";
import { notify, getErrorMessage } from "../utils/notify";
import "./SendOrderEmailModal.css";

interface SendOrderEmailModalProps {
  orderId: number;
  orderNumber: string;
  clientEmail?: string;
  clientName: string;
  factoryEmail?: string;
  factoryName: string;
  onClose: () => void;
}

type RecipientResult = { type: "client" | "factory"; email: string; success: boolean };

/**
 * Modal de confirmação para enviar o resumo de um pedido por e-mail.
 * Permite escolher independentemente se envia para o cliente e/ou a fábrica,
 * com o e-mail de cada um pré-preenchido (a partir do cadastro) mas editável.
 */
const SendOrderEmailModal: React.FC<SendOrderEmailModalProps> = ({
  orderId,
  orderNumber,
  clientEmail,
  clientName,
  factoryEmail,
  factoryName,
  onClose,
}) => {
  const [sendToClient, setSendToClient] = useState(!!clientEmail);
  const [sendToFactory, setSendToFactory] = useState(!!factoryEmail);
  const [clientEmailInput, setClientEmailInput] = useState(clientEmail || "");
  const [factoryEmailInput, setFactoryEmailInput] = useState(factoryEmail || "");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<RecipientResult[] | null>(null);

  useEffect(() => {
    // Trava o scroll do fundo enquanto o modal está aberto
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = () => {
    const recipients: { type: "client" | "factory"; email: string }[] = [];

    if (sendToClient) {
      if (!isValidEmail(clientEmailInput)) {
        notify.warning("Informe um e-mail válido para o cliente.");
        return;
      }
      recipients.push({ type: "client", email: clientEmailInput.trim() });
    }
    if (sendToFactory) {
      if (!isValidEmail(factoryEmailInput)) {
        notify.warning("Informe um e-mail válido para a fábrica.");
        return;
      }
      recipients.push({ type: "factory", email: factoryEmailInput.trim() });
    }

    if (recipients.length === 0) {
      notify.warning("Selecione ao menos um destinatário para enviar o pedido.");
      return;
    }

    setSending(true);
    api
      .post(`/orders/${orderId}/send-email`, { recipients })
      .then((res) => {
        setResults(res.data.results);
        const allSuccess = res.data.results.every((r: RecipientResult) => r.success);
        if (allSuccess) {
          notify.success("Pedido enviado por e-mail com sucesso!");
        } else {
          notify.warning("Alguns e-mails não puderam ser enviados. Veja o detalhe abaixo.");
        }
      })
      .catch((err) => {
        console.error("Erro ao enviar e-mail do pedido:", err);
        notify.error(getErrorMessage(err, "Não foi possível enviar o e-mail do pedido."));
      })
      .finally(() => setSending(false));
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal send-email-modal">
        <div className="modal-header">
          <h2><FaEnvelope className="modal-title-icon" /> Enviar Pedido {orderNumber} por E-mail</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {results ? (
            <div className="send-email-results">
              <p style={{ marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                Resultado do envio:
              </p>
              {results.map((r) => (
                <div key={r.type} className={`send-email-result-row ${r.success ? "success" : "error"}`}>
                  {r.success ? <FaCheckCircle /> : <FaExclamationCircle />}
                  <div>
                    <strong>{r.type === "client" ? "Cliente" : "Fábrica"}</strong>
                    <div style={{ fontSize: "0.9rem" }}>{r.email}</div>
                  </div>
                  <span className="send-email-result-status">
                    {r.success ? "Enviado" : "Falhou"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p style={{ marginBottom: "1.25rem", color: "var(--color-text-muted)" }}>
                Selecione para quem deseja enviar o resumo deste pedido. Você pode revisar e alterar o e-mail antes de confirmar.
              </p>

              <div className="send-email-recipient">
                <label className="send-email-checkbox">
                  <input
                    type="checkbox"
                    checked={sendToClient}
                    onChange={(e) => setSendToClient(e.target.checked)}
                  />
                  <span>Enviar para o cliente — <strong>{clientName}</strong></span>
                </label>
                {sendToClient && (
                  <input
                    type="email"
                    value={clientEmailInput}
                    onChange={(e) => setClientEmailInput(e.target.value)}
                    placeholder="email@cliente.com"
                    className="send-email-input"
                  />
                )}
              </div>

              <div className="send-email-recipient">
                <label className="send-email-checkbox">
                  <input
                    type="checkbox"
                    checked={sendToFactory}
                    onChange={(e) => setSendToFactory(e.target.checked)}
                  />
                  <span>Enviar para a fábrica — <strong>{factoryName}</strong></span>
                </label>
                {sendToFactory && (
                  <input
                    type="email"
                    value={factoryEmailInput}
                    onChange={(e) => setFactoryEmailInput(e.target.value)}
                    placeholder="email@fabrica.com"
                    className="send-email-input"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {results ? (
            <button className="btn btn-primary" onClick={onClose}>Fechar</button>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={sending}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSend}
                disabled={sending || (!sendToClient && !sendToFactory)}
              >
                <FaPaperPlane /> {sending ? "Enviando..." : "Confirmar Envio"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendOrderEmailModal;
