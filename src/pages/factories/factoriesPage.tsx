import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ToggleSwitch from "../../components/ToggleSwitch";
import "./Factories.css";
import { useNavigate } from "react-router-dom";
import {
  FaIndustry,
  FaPlus,
  FaBuilding,
  FaFileAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  code: string;
  unitPrice: number;
  factoryId: number;
}

interface Factory {
  id: number;
  name: string;
  razaoSocial?: string;
  cnpj?: string;
  email: string;
  phone: string;
  cidade?: string;
  estado?: string;
  active: boolean;
  products: Product[];
}

const FactoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState<Factory[]>([]);

  const fetchFactories = () => {
    api
      .get("/factories")
      .then((res) => setFactories(res.data))
      .catch((err) => console.error("Erro ao buscar fábricas:", err));
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  const handleToggleActive = (factory: Factory, nextActive: boolean) => {
    // Atualização otimista para resposta visual imediata
    setFactories((prev) =>
      prev.map((f) => (f.id === factory.id ? { ...f, active: nextActive } : f))
    );

    api
      .patch(`/factories/${factory.id}/status`, { active: nextActive })
      .catch((err) => {
        console.error("Erro ao atualizar status da fábrica:", err);
        alert("Não foi possível atualizar o status da fábrica. Tente novamente.");
        // Desfaz a atualização otimista em caso de erro
        setFactories((prev) =>
          prev.map((f) => (f.id === factory.id ? { ...f, active: factory.active } : f))
        );
      });
  };

  return (
    <div className="factories-page">
      <Sidebar />
      <main className="factories-main">
        <div className="page-header">
          <div>
            <h1><FaIndustry className="page-title-icon" /> Fábricas</h1>
            <p>Gerencie suas fábricas parceiras</p>
          </div>
          <button className="btn btn-success" onClick={() => navigate("/fabricas/novo")}>
            <FaPlus /> Nova Fábrica
          </button>
        </div>

        {factories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaIndustry /></div>
            <h3>Nenhuma fábrica cadastrada</h3>
            <p>Clique em "Nova Fábrica" para começar</p>
          </div>
        ) : (
          <div className="factories-grid">
            {factories.map((factory) => (
              <div
                key={factory.id}
                className={`factory-card ${!factory.active ? "factory-card-inactive" : ""}`}
              >
                <div className="factory-card-top">
                  <div>
                    <div className="factory-name-row">
                      <span className="factory-name">{factory.name}</span>
                      <ToggleSwitch
                        checked={factory.active}
                        onChange={(next) => handleToggleActive(factory, next)}
                        id={`factory-toggle-${factory.id}`}
                      />
                    </div>
                    {factory.razaoSocial && (
                      <div className="factory-contact-row"><FaBuilding className="row-icon" /> {factory.razaoSocial}</div>
                    )}
                    {factory.cnpj && (
                      <div className="factory-contact-row"><FaFileAlt className="row-icon" /> {factory.cnpj}</div>
                    )}
                    <div className="factory-contact-row"><FaEnvelope className="row-icon" /> {factory.email}</div>
                    <div className="factory-contact-row"><FaPhone className="row-icon" /> {factory.phone}</div>
                    {(factory.cidade || factory.estado) && (
                      <div className="factory-contact-row">
                        <FaMapMarkerAlt className="row-icon" /> {[factory.cidade, factory.estado].filter(Boolean).join(" - ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="factory-stats">
                  <strong>{factory.products?.length || 0}</strong>
                  <span>produtos cadastrados</span>
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate(`/factories/${factory.id}`)}
                >
                  <FaEye /> Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FactoriesPage;
