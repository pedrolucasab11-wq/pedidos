import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import FactoryForm, { emptyFactoryForm, FactoryFormData } from "../../components/FactoryForm";
import { notify } from "../../utils/notify";
import { FaArrowLeft, FaIndustry } from "react-icons/fa";
import "./Factories.css";

const NewFactoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (data: FactoryFormData) => {
    setSubmitting(true);
    api
      .post("/factories", data)
      .then(() => {
        notify.success("Fábrica cadastrada com sucesso!");
        navigate("/fabricas");
      })
      .catch((err) => {
        console.error("Erro ao cadastrar fábrica:", err);
        notify.apiError(err, "Erro ao cadastrar fábrica.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="factories-page">
      <Sidebar />
      <main className="factories-main">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/fabricas")}
        >
          <FaArrowLeft /> Voltar para Fábricas
        </button>

        <div className="page-header">
          <div>
            <h1><FaIndustry className="page-title-icon" /> Nova Fábrica</h1>
            <p>Cadastro completo com dados da Receita Federal</p>
          </div>
        </div>

        <FactoryForm
          initialData={emptyFactoryForm}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/fabricas")}
          submitting={submitting}
          submitLabel="Salvar Fábrica"
        />
      </main>
    </div>
  );
};

export default NewFactoryPage;
