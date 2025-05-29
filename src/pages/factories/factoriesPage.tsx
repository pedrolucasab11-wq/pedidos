import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import "./Factories.css";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  code: string;
  colors: string[];
  unitPrice: number;
  factoryId: number;
}

interface Factory {
  id: number;
  logo: string;
  name: string;
  email: string;
  phone: string;
  products: Product[];
}

interface NewFactory {
  logo: string;
  name: string;
  email: string;
  phone: string;
}

const FactoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [showFactoryModal, setShowFactoryModal] = useState(false);
  const [newFactory, setNewFactory] = useState<NewFactory>({
    logo: "",
    name: "",
    email: "",
    phone: "",
  });

  const fetchFactories = () => {
    axios
      .get("http://localhost:3333/factories")
      .then((res) => setFactories(res.data))
      .catch((err) => console.error("Erro ao buscar fábricas:", err));
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  // Adicionar listener para ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showFactoryModal) {
          setShowFactoryModal(false);
        }
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showFactoryModal]);

  const handleFactoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFactory((prev) => ({ ...prev, [name]: value }));
  };

  const handleFactorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação extra
    if (
      !newFactory.name.trim() ||
      !newFactory.email.trim() ||
      !newFactory.phone.trim()
    ) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    axios
      .post("http://localhost:3333/factories", newFactory)
      .then(() => {
        alert("Fábrica cadastrada com sucesso!");
        setShowFactoryModal(false);
        setNewFactory({ logo: "", name: "", email: "", phone: "" });
        fetchFactories();
      })
      .catch((err) => {
        console.error("Erro ao cadastrar fábrica:", err);
        alert("Erro ao cadastrar fábrica.");
      });
  };

  return (
    <div className="factories-page">
      <Sidebar />
      <main className="factories-main">
        <div className="factories-header">
          <div className="header-content">
            <div>
              <h1 className="page-title">Fábricas</h1>
              <p className="page-subtitle">Gerencie suas fábricas parceiras</p>
            </div>
            <button
              className="btn-add-factory"
              onClick={() => setShowFactoryModal(true)}
            >
              + Nova Fábrica
            </button>
          </div>
        </div>

        <div className="factories-grid">
          {factories.map((factory) => (
            <div key={factory.id} className="factory-card">
              <div className="factory-card-header">
                <div className="factory-logo-container">
                  <img
                    src={factory.logo}
                    alt={`Logo ${factory.name}`}
                    className="factory-logo"
                  />
                </div>
                <div className="factory-info">
                  <h3 className="factory-name">{factory.name}</h3>
                  <div className="factory-contact">
                    <span className="factory-email">{factory.email}</span>
                    <span className="factory-phone">{factory.phone}</span>
                  </div>
                </div>
              </div>

              <div className="factory-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {factory.products?.length || 0}
                  </span>
                  <span className="stat-label">Produtos</span>
                </div>
              </div>

              <div className="factory-card-footer">
                <button
                  className="btn-view-factory"
                  onClick={() => navigate(`/factories/${factory.id}`)}
                >
                  Ver Fábrica
                </button>
              </div>
            </div>
          ))}
        </div>

        {factories.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma fábrica encontrada</p>
          </div>
        )}

        {/* Modal Fábrica */}
        {showFactoryModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Nova Fábrica</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowFactoryModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleFactorySubmit} className="modal-form">
                <div className="form-group">
                  <label>Logo (URL)</label>
                  <input
                    type="url"
                    name="logo"
                    value={newFactory.logo}
                    onChange={handleFactoryChange}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    name="name"
                    value={newFactory.name}
                    onChange={handleFactoryChange}
                    placeholder="Nome da fábrica"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newFactory.email}
                    onChange={handleFactoryChange}
                    placeholder="contato@fabrica.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newFactory.phone}
                    onChange={handleFactoryChange}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowFactoryModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save">
                    Salvar Fábrica
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FactoriesPage;
