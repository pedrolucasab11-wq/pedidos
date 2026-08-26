import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import FactoryForm, { FactoryFormData } from "../../components/FactoryForm";
import { notify } from "../../utils/notify";
import { FaArrowLeft, FaIndustry, FaBoxOpen } from "react-icons/fa";
import "./Factories.css";

// Converte uma data ISO (vinda do backend) para o formato yyyy-MM-dd
// esperado pelo <input type="date">.
const toDateInputValue = (isoDate?: string) => {
  if (!isoDate) return "";
  return isoDate.slice(0, 10);
};

const EditFactoryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<FactoryFormData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/factories/${id}`)
      .then((res) => {
        const f = res.data;
        setInitialData({
          cnpj: f.cnpj || "",
          name: f.name || "",
          razaoSocial: f.razaoSocial || "",
          inscricaoEstadual: f.inscricaoEstadual || "",
          phone: f.phone || "",
          celular: f.celular || "",
          email: f.email || "",
          cep: f.cep || "",
          estado: f.estado || "",
          cidade: f.cidade || "",
          bairro: f.bairro || "",
          endereco: f.endereco || "",
          dataAbertura: toDateInputValue(f.dataAbertura),
          porte: f.porte || "",
          atividadePrincipal: f.atividadePrincipal || "",
          atividadeSecundaria: f.atividadeSecundaria || "",
          naturezaJuridica: f.naturezaJuridica || "",
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar fábrica:", err);
        notify.apiError(err, "Não foi possível carregar os dados da fábrica.");
        setLoadError(true);
      });
  }, [id]);

  const handleSubmit = (data: FactoryFormData) => {
    setSubmitting(true);
    api
      .put(`/factories/${id}`, data)
      .then(() => {
        notify.success("Fábrica atualizada com sucesso!");
        navigate(`/factories/${id}`);
      })
      .catch((err) => {
        console.error("Erro ao atualizar fábrica:", err);
        notify.apiError(err, "Erro ao atualizar fábrica.");
      })
      .finally(() => setSubmitting(false));
  };

  if (loadError) {
    return (
      <div className="factories-page">
        <Sidebar />
        <main className="factories-main">
          <button className="back-btn" onClick={() => navigate("/fabricas")}>
            <FaArrowLeft /> Voltar para Fábricas
          </button>
          <div className="empty-state">
            <div className="empty-icon"><FaBoxOpen /></div>
            <h3>Não foi possível carregar esta fábrica</h3>
            <p>Verifique sua conexão ou tente novamente mais tarde.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="factories-page">
        <Sidebar />
        <main className="factories-main">
          <p className="loading-text">Carregando fábrica...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="factories-page">
      <Sidebar />
      <main className="factories-main">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(`/factories/${id}`)}
        >
          <FaArrowLeft /> Voltar para Detalhes da Fábrica
        </button>

        <div className="page-header">
          <div>
            <h1><FaIndustry className="page-title-icon" /> Editar Fábrica</h1>
            <p>Atualize os dados cadastrais da fábrica</p>
          </div>
        </div>

        <FactoryForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/factories/${id}`)}
          submitting={submitting}
          submitLabel="Salvar Alterações"
        />
      </main>
    </div>
  );
};

export default EditFactoryPage;
