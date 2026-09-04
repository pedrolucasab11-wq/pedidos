import { useState } from "react";
import api from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaLock, FaExclamationTriangle, FaUserPlus } from "react-icons/fa";
import { maskPhone } from "../../utils/masks";
import { getErrorMessage } from "../../utils/notify";
import logo from "../../assets/logo.png";
import "../login/LoginPage.css";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [representation, setRepresentation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        phone,
        representation: representation.trim() || undefined,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("sellerId", response.data.seller.id);
      navigate("/dashboard");
    } catch (err: any) {
      setError(getErrorMessage(err, "Não foi possível criar sua conta. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Lado esquerdo — branding */}
      <div className="login-left">
        <div className="login-brand">
          <img src={logo} alt="Logo" className="login-brand-logo" />
          <h1>Sistema de Pedidos</h1>
          <p>Crie sua conta e comece a gerenciar seus clientes, fábricas e pedidos.</p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Criar conta</h2>
            <p>Preencha seus dados para começar</p>
          </div>

          {error && (
            <div className="login-error">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name"><FaUser className="label-icon" /> Nome completo</label>
              <input
                id="name"
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email"><FaEnvelope className="label-icon" /> E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone"><FaPhone className="label-icon" /> Telefone</label>
              <input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="representation"><FaBuilding className="label-icon" /> Representação (opcional)</label>
              <input
                id="representation"
                type="text"
                placeholder="Ex: Representações Silva Ltda."
                value={representation}
                onChange={(e) => setRepresentation(e.target.value)}
                autoComplete="organization"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password"><FaLock className="label-icon" /> Senha</label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword"><FaLock className="label-icon" /> Confirmar senha</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Criando conta..." : (<><FaUserPlus /> Criar conta</>)}
            </button>
          </form>

          <div className="login-switch-link">
            Já tem uma conta? <Link to="/">Fazer login</Link>
          </div>

          <div className="login-footer-card">
            © 2025 — Todos os direitos reservados
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
