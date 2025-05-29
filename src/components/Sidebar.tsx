import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

interface Seller {
  id: number;
  name: string;
  logo: string;
}

function Sidebar() {
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const sellerId = localStorage.getItem("sellerId");

    if (sellerId) {
      fetch(`https://backend-pedidos-i1qd.onrender.com/sellers/${sellerId}`)
        .then((res) => res.json())
        .then((data) => setSeller(data))
        .catch((err) => console.error("Erro ao buscar vendedor:", err));
    }
  }, []);

  if (!seller) {
    return <div className="sidebar">Carregando...</div>;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={seller.logo} alt="Logo" className="seller-logo" />
        <h3>{seller.name}</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/pedidos">Fazer Pedido</NavLink>
        <NavLink to="/fabricas">Fábricas</NavLink>
        <NavLink to="/clientes">Clientes</NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;
