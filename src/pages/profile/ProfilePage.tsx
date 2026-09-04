import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { maskPhone } from "../../utils/masks";
import { notify, getErrorMessage } from "../../utils/notify";
import {
  FaUserCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaLock,
  FaPlus,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import "./Profile.css";

interface SellerProfile {
  id: number;
  name: string;
  email: string;
  phones: string[];
  representation?: string | null;
  logo?: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [representation, setRepresentation] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const seller: SellerProfile = res.data;
        setName(seller.name || "");
        setEmail(seller.email || "");
        setRepresentation(seller.representation || "");
        setPhones(seller.phones && seller.phones.length > 0 ? seller.phones : [""]);
      })
      .catch((err) => {
        console.error("Erro ao carregar perfil:", err);
        notify.apiError(err, "Não foi possível carregar seus dados.");
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePhoneChange = (index: number, value: string) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? maskPhone(value) : p)));
  };

  const handleAddPhone = () => setPhones((prev) => [...prev, ""]);

  const handleRemovePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhones = phones.map((p) => p.trim()).filter(Boolean);
    if (!name.trim() || !email.trim() || cleanedPhones.length === 0) {
      notify.warning("Nome, e-mail e ao menos um telefone são obrigatórios.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      notify.warning("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      notify.warning("As senhas não coincidem.");
      return;
    }

    const data: any = {
      name: name.trim(),
      email: email.trim(),
      phones: cleanedPhones,
      representation: representation.trim(),
    };
    if (newPassword) data.password = newPassword;

    setSaving(true);
    api
      .put("/auth/me", data)
      .then(() => {
        notify.success("Perfil atualizado com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((err) => {
        console.error("Erro ao atualizar perfil:", err);
        notify.error(getErrorMessage(err, "Não foi possível atualizar seu perfil."));
      })
      .finally(() => setSaving(false));
  };

  if (loadError) {
    return (
      <div className="profile-container">
        <Sidebar />
        <div className="profile-content">
          <div className="empty-state">
            <div className="empty-icon"><FaUserCircle /></div>
            <h3>Não foi possível carregar seu perfil</h3>
            <p>Verifique sua conexão ou tente novamente mais tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <Sidebar />
        <div className="profile-content">
          <p className="loading-text">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Sidebar />
      <div className="profile-content">
        <div className="page-header">
          <div>
            <h1><FaUserCircle className="page-title-icon" /> Meu Perfil</h1>
            <p>Atualize seus dados pessoais e de representação</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="section-divider"><FaUser /> Dados Pessoais</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-name">Nome *</label>
              <input
                id="p-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="p-email"><FaEnvelope className="label-icon" /> E-mail *</label>
              <input
                id="p-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p-representation"><FaBuilding className="label-icon" /> Representação</label>
            <input
              id="p-representation"
              type="text"
              value={representation}
              onChange={(e) => setRepresentation(e.target.value)}
              placeholder="Ex: Representações Silva Ltda."
            />
            <small className="field-hint">Nome da representação comercial exibido nos pedidos e PDFs. Opcional.</small>
          </div>

          <div className="section-divider"><FaPhone /> Telefones</div>
          <div className="phone-list">
            {phones.map((phoneValue, index) => (
              <div className="phone-row" key={index}>
                <input
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                {phones.length > 1 && (
                  <button
                    type="button"
                    className="phone-remove-btn"
                    onClick={() => handleRemovePhone(index)}
                    title="Remover telefone"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleAddPhone}>
            <FaPlus /> Adicionar outro telefone
          </button>

          <div className="section-divider"><FaLock /> Alterar Senha (opcional)</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-password">Nova senha</label>
              <input
                id="p-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="p-confirm-password">Confirmar nova senha</label>
              <input
                id="p-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "1.1rem", padding: "0 24px", height: "64px" }}
              onClick={() => navigate("/dashboard")}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-success"
              style={{ fontSize: "1.2rem", padding: "0 30px", height: "64px" }}
              disabled={saving}
            >
              <FaCheck /> {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
