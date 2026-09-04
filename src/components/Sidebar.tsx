import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaClipboardList,
  FaIndustry,
  FaUsers,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import api from "../services/api";
import "./Sidebar.css";

interface Seller {
  id: number;
  name: string;
  logo: string;
  representation?: string | null;
}

function Sidebar() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setSeller(res.data))
      .catch((err) => console.error("Erro ao buscar vendedor:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sellerId");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {seller ? (
          <>
            <img src={seller.logo} alt="Logo" className="seller-logo" />
            <h3>{seller.name}</h3>
            <span>{seller.representation || "Representação"}</span>
          </>
        ) : (
          <h3>Carregando...</h3>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="nav-icon"><FaChartPie /></span> Dashboard
        </NavLink>
        <NavLink to="/pedidos" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="nav-icon"><FaClipboardList /></span> Fazer Pedido
        </NavLink>
        <NavLink to="/fabricas" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="nav-icon"><FaIndustry /></span> Fábricas
        </NavLink>
        <NavLink to="/clientes" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="nav-icon"><FaUsers /></span> Clientes
        </NavLink>
        <NavLink to="/perfil" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="nav-icon"><FaUserCircle /></span> Meu Perfil
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="nav-icon"><FaSignOutAlt /></span> Sair
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
