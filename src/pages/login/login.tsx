import { useState } from "react";
import api from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaExclamationTriangle, FaSignInAlt } from "react-icons/fa";
import { getErrorMessage } from "../../utils/notify";
import logo from "../../assets/logo.png";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("sellerId", response.data.seller.id);
      navigate("/dashboard");
    } catch (err: any) {
      setError(getErrorMessage(err, "E-mail ou senha incorretos. Tente novamente."));
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
          <p>Gerencie seus pedidos com facilidade e segurança.</p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Bem-vindo!</h2>
            <p>Faça seu login para continuar</p>
          </div>

          {error && (
            <div className="login-error">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
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
              <label htmlFor="password"><FaLock className="label-icon" /> Senha</label>
              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Entrando..." : (<><FaSignInAlt /> Entrar</>)}
            </button>
          </form>

          <div className="login-switch-link">
            Ainda não tem uma conta? <Link to="/registro">Cadastre-se</Link>
          </div>

          <div className="login-footer-card">
            © 2025 — Todos os direitos reservados
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
