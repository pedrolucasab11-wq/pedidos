import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { lookupCNPJ } from "../../services/cnpjLookup";
import { maskCNPJ, maskPhone, maskCEP, validateCNPJ } from "../../utils/masks";
import {
  FaArrowLeft,
  FaIndustry,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaLandmark,
  FaSpinner,
  FaCheckCircle,
  FaCheck,
} from "react-icons/fa";
import "./Factories.css";

interface FactoryForm {
  // Dados
  cnpj: string;
  name: string; // nome fantasia
  razaoSocial: string;
  inscricaoEstadual: string;
  // Contato
  phone: string; // telefone comercial
  celular: string;
  email: string;
  // Endereço
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  endereco: string;
  // Atividade econômica
  dataAbertura: string;
  porte: string;
  atividadePrincipal: string;
  atividadeSecundaria: string;
  naturezaJuridica: string;
}

const initialForm: FactoryForm = {
  cnpj: "",
  name: "",
  razaoSocial: "",
  inscricaoEstadual: "",
  phone: "",
  celular: "",
  email: "",
  cep: "",
  estado: "",
  cidade: "",
  bairro: "",
  endereco: "",
  dataAbertura: "",
  porte: "",
  atividadePrincipal: "",
  atividadeSecundaria: "",
  naturezaJuridica: "",
};

const NewFactoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FactoryForm>(initialForm);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [cnpjAutoFilled, setCnpjAutoFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;
    if (name === "phone" || name === "celular") value = maskPhone(value);
    if (name === "cep") value = maskCEP(value);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCNPJ = e.target.value.replace(/\D/g, "");
    const formattedCNPJ = maskCNPJ(e.target.value);
    setForm((prev) => ({ ...prev, cnpj: formattedCNPJ }));
    setCnpjAutoFilled(false);

    if (rawCNPJ.length === 14) {
      if (!validateCNPJ(rawCNPJ)) {
        alert("CNPJ inválido! Verifique os números digitados.");
        return;
      }

      setIsLoadingCNPJ(true);
      try {
        const data = await lookupCNPJ(rawCNPJ);
        setForm((prev) => ({
          ...prev,
          razaoSocial: data.razaoSocial,
          name: prev.name || data.nomeFantasia,
          cep: data.cep ? maskCEP(data.cep) : prev.cep,
          estado: data.estado,
          cidade: data.cidade,
          bairro: data.bairro,
          endereco: data.endereco,
          dataAbertura: data.dataAbertura,
          porte: data.porte,
          atividadePrincipal: data.atividadePrincipal,
          atividadeSecundaria: data.atividadeSecundaria,
          naturezaJuridica: data.naturezaJuridica,
        }));
        setCnpjAutoFilled(true);
      } catch (error) {
        console.error("Erro ao consultar CNPJ:", error);
        alert(
          "Não foi possível localizar este CNPJ na base da Receita Federal. Preencha os dados manualmente."
        );
      } finally {
        setIsLoadingCNPJ(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.cnpj && !validateCNPJ(form.cnpj)) {
      alert("CNPJ inválido!");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert("Preencha os campos obrigatórios: Nome Fantasia, E-mail comercial e Telefone comercial.");
      return;
    }

    setSubmitting(true);
    api
      .post("/factories", form)
      .then(() => {
        alert("Fábrica cadastrada com sucesso!");
        navigate("/fabricas");
      })
      .catch((err) => {
        console.error("Erro ao cadastrar fábrica:", err);
        const message =
          err?.response?.data?.error || "Erro ao cadastrar fábrica.";
        alert(message);
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

        <form onSubmit={handleSubmit} className="card">
          {/* Seção 1: Dados */}
          <div className="section-divider"><FaIdCard /> Dados</div>
          <div className="form-group">
            <label htmlFor="f-cnpj">CNPJ *</label>
            <input
              id="f-cnpj"
              type="text"
              name="cnpj"
              value={form.cnpj}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
            />
            {isLoadingCNPJ && (
              <small className="cep-loading"><FaSpinner className="spin-icon" /> Consultando CNPJ na Receita Federal...</small>
            )}
            {cnpjAutoFilled && !isLoadingCNPJ && (
              <small className="cep-loading" style={{ color: "var(--color-success)" }}>
                <FaCheckCircle /> Dados preenchidos automaticamente. Revise antes de salvar.
              </small>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-name">Nome Fantasia *</label>
              <input
                id="f-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Fábrica São Paulo"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-razaoSocial">Razão Social</label>
              <input
                id="f-razaoSocial"
                type="text"
                name="razaoSocial"
                value={form.razaoSocial}
                onChange={handleChange}
                placeholder="Razão social da empresa"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="f-ie">Inscrição Estadual</label>
            <input
              id="f-ie"
              type="text"
              name="inscricaoEstadual"
              value={form.inscricaoEstadual}
              onChange={handleChange}
              placeholder="000.000.000.000"
            />
          </div>

          {/* Seção 2: Contato */}
          <div className="section-divider"><FaPhone /> Contato</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-phone">Telefone Comercial *</label>
              <input
                id="f-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 3333-4444"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-celular">Celular</label>
              <input
                id="f-celular"
                type="tel"
                name="celular"
                value={form.celular}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="f-email">E-mail Comercial *</label>
            <input
              id="f-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="contato@fabrica.com"
              required
            />
          </div>
          {/* Seção 3: Endereço */}
          <div className="section-divider"><FaMapMarkerAlt /> Endereço</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-cep">CEP</label>
              <input
                id="f-cep"
                type="text"
                name="cep"
                value={form.cep}
                onChange={handleChange}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-estado">Estado</label>
              <input
                id="f-estado"
                type="text"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-cidade">Cidade</label>
              <input
                id="f-cidade"
                type="text"
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
                placeholder="Nome da cidade"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-bairro">Bairro</label>
              <input
                id="f-bairro"
                type="text"
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
                placeholder="Nome do bairro"
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="f-endereco">Endereço</label>
              <input
                id="f-endereco"
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                placeholder="Rua, número, complemento"
              />
            </div>
          </div>

          {/* Seção 4: Atividade Econômica */}
          <div className="section-divider"><FaLandmark /> Atividade Econômica</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-dataAbertura">Data de Abertura</label>
              <input
                id="f-dataAbertura"
                type="date"
                name="dataAbertura"
                value={form.dataAbertura}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-porte">Porte</label>
              <input
                id="f-porte"
                type="text"
                name="porte"
                value={form.porte}
                onChange={handleChange}
                placeholder="Ex: Microempresa"
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-naturezaJuridica">Natureza Jurídica</label>
              <input
                id="f-naturezaJuridica"
                type="text"
                name="naturezaJuridica"
                value={form.naturezaJuridica}
                onChange={handleChange}
                placeholder="Ex: Sociedade Limitada"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="f-atividadePrincipal">Atividade Principal</label>
            <input
              id="f-atividadePrincipal"
              type="text"
              name="atividadePrincipal"
              value={form.atividadePrincipal}
              onChange={handleChange}
              placeholder="Ex: Fabricação de produtos têxteis"
            />
          </div>
          <div className="form-group">
            <label htmlFor="f-atividadeSecundaria">Atividade Secundária</label>
            <textarea
              id="f-atividadeSecundaria"
              name="atividadeSecundaria"
              value={form.atividadeSecundaria}
              onChange={handleChange}
              placeholder="Atividades secundárias registradas"
              rows={3}
            />
          </div>

          <div className="modal-footer" style={{ padding: "1.5rem 0 0", borderTop: "2px solid #e8edf2" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("/fabricas")}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? "Salvando..." : (<><FaCheck /> Salvar Fábrica</>)}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewFactoryPage;
