import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3333/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem('sellerId', response.data.seller.id);
      navigate("/dashboard");
    } catch (error) {
      alert("Login falhou");
    }
  };
  
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Bem-vindo</h2>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>
      <footer className="login-footer">
        <img src={logo} alt="Logo" />
        <p>© 2025 Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

export default LoginPage;
