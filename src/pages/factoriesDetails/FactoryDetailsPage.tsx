import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ToggleSwitch from "../../components/ToggleSwitch";
import { maskCurrency } from "../../utils/masks";
import { notify } from "../../utils/notify";
import {
  FaArrowLeft,
  FaBuilding,
  FaFileAlt,
  FaReceipt,
  FaEnvelope,
  FaPhone,
  FaMobileAlt,
  FaMapMarkerAlt,
  FaLandmark,
  FaCalendarAlt,
  FaChartBar,
  FaBalanceScale,
  FaIndustry,
  FaBoxOpen,
  FaPlus,
  FaTimes,
  FaTag,
  FaStickyNote,
  FaHashtag,
  FaCheck,
  FaPencilAlt,
} from "react-icons/fa";
import "./FactoriesDetails.css";

interface Product {
  id: number;
  name: string;
  code: string;
  type?: string;
  observation?: string;
  unitPrice: number | null;
}

interface Factory {
  id: number;
  name: string;
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  email: string;
  phone: string;
  celular?: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  endereco?: string;
  dataAbertura?: string;
  porte?: string;
  atividadePrincipal?: string;
  atividadeSecundaria?: string;
  naturezaJuridica?: string;
  active: boolean;
  products: Product[];
}

const FactoryDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    type: "",
    observation: "",
    unitPrice: 0,
    factoryId: 0,
  });
  const [priceInput, setPriceInput] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Função para gerar código automático do produto
  const generateProductCode = () => {
    let maxCode = 0;
    factory?.products.forEach((product) => {
      const codeMatch = product.code.match(/PRD-(\d+)/);
      if (codeMatch) {
        const codeNumber = parseInt(codeMatch[1]);
        if (codeNumber > maxCode) {
          maxCode = codeNumber;
        }
      }
    });

    const nextCode = maxCode + 1;
    return `PRD-${nextCode.toString().padStart(3, "0")}`;
  };

  // Função para abrir o modal de produto e gerar código automaticamente
  const openProductModal = (factoryId: number) => {
    const autoCode = generateProductCode();
    setNewProduct({
      name: "",
      code: autoCode,
      type: "",
      observation: "",
      unitPrice: 0,
      factoryId,
    });
    setPriceInput(""); // Reset do priceInput
    setShowProductModal(true);
  };

  useEffect(() => {
    api
      .get(`/factories/${id}`)
      .then((res) => setFactory(res.data))
      .catch((err) => {
        console.error("Erro ao buscar fábrica:", err);
        notify.apiError(err, "Não foi possível carregar os dados da fábrica.");
        setLoadError(true);
      });
  }, [id]);

  const handleToggleActive = (nextActive: boolean) => {
    if (!factory) return;
    const previousActive = factory.active;

    // Atualização otimista para resposta visual imediata
    setFactory({ ...factory, active: nextActive });

    api
      .patch(`/factories/${factory.id}/status`, { active: nextActive })
      .catch((err) => {
        console.error("Erro ao atualizar status da fábrica:", err);
        notify.apiError(err, "Não foi possível atualizar o status da fábrica. Tente novamente.");
        setFactory((prev) => (prev ? { ...prev, active: previousActive } : prev));
      });
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "unitPrice") {
      const formattedPrice = maskCurrency(value);
      setPriceInput(formattedPrice);
      
      const numericValue = parseFloat(formattedPrice.replace(/\./g, "").replace(",", "."));
      setNewProduct((prev) => ({ ...prev, unitPrice: numericValue || 0 }));
    } else {
      setNewProduct((prev) => ({ ...prev, [name]: value }));
    }
  };



  const MAX_PRODUCT_FIELD_LENGTH = 150;

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = newProduct.name.trim();
    const code = newProduct.code.trim();
    const type = newProduct.type.trim();

    if (!name || !code) {
      notify.warning("Preencha os campos obrigatórios (Nome e Código do produto).");
      return;
    }
    if (name.length > MAX_PRODUCT_FIELD_LENGTH) {
      notify.warning(`O nome do produto deve ter no máximo ${MAX_PRODUCT_FIELD_LENGTH} caracteres.`);
      return;
    }
    if (code.length > MAX_PRODUCT_FIELD_LENGTH) {
      notify.warning(`O código do produto deve ter no máximo ${MAX_PRODUCT_FIELD_LENGTH} caracteres.`);
      return;
    }
    if (type.length > MAX_PRODUCT_FIELD_LENGTH) {
      notify.warning(`O tipo do produto deve ter no máximo ${MAX_PRODUCT_FIELD_LENGTH} caracteres.`);
      return;
    }

    setSubmittingProduct(true);
    api
      .post("/products", {
        ...newProduct,
        name,
        code,
        type,
        observation: newProduct.observation.trim(),
        // Preço de referência é opcional: envia null se o campo ficou vazio.
        unitPrice: priceInput.trim() === "" ? null : newProduct.unitPrice,
      })
      .then(() => {
        notify.success("Produto cadastrado com sucesso!");
        setShowProductModal(false);
        setNewProduct({
          name: "",
          code: "",
          type: "",
          observation: "",
          unitPrice: 0,
          factoryId: 0,
        });
        setPriceInput("");
        // Refresh
        return api.get(`/factories/${id}`);
      })
      .then((res) => setFactory(res.data))
      .catch((err) => {
        console.error("Erro ao cadastrar produto:", err);
        notify.apiError(err, "Erro ao cadastrar produto.");
      })
      .finally(() => setSubmittingProduct(false));
  };

  if (loadError) {
    return (
      <div className="factory-details-page">
        <Sidebar />
        <main className="factory-details-main">
          <button className="back-btn" onClick={() => window.history.back()}>
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

  if (!factory) return <p className="loading-text">Carregando...</p>;

  return (
    <div className="factory-details-page">
      <Sidebar />
      <main className="factory-details-main">
        <button className="back-btn" onClick={() => window.history.back()}>
          <FaArrowLeft /> Voltar para Fábricas
        </button>

        {/* Hero */}
        <div className={`factory-hero ${!factory.active ? "factory-hero-inactive" : ""}`}>
          <div className="factory-hero-info">
            <div className="factory-hero-status-row">
              <h2>{factory.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  className="btn btn-ghost btn-icon-sm"
                  onClick={() => navigate(`/fabricas/${factory.id}/editar`)}
                  title="Editar dados da fábrica"
                >
                  <FaPencilAlt /> Editar
                </button>
                <ToggleSwitch
                  checked={factory.active}
                  onChange={handleToggleActive}
                  id="factory-detail-toggle"
                />
              </div>
            </div>
            {factory.razaoSocial && (
              <div className="factory-contact-row"><FaBuilding className="row-icon" /> {factory.razaoSocial}</div>
            )}
            {factory.cnpj && <div className="factory-contact-row"><FaFileAlt className="row-icon" /> CNPJ: {factory.cnpj}</div>}
            {factory.inscricaoEstadual && (
              <div className="factory-contact-row"><FaReceipt className="row-icon" /> IE: {factory.inscricaoEstadual}</div>
            )}
            <div className="factory-contact-row"><FaEnvelope className="row-icon" /> {factory.email}</div>
            <div className="factory-contact-row"><FaPhone className="row-icon" /> {factory.phone}</div>
            {factory.celular && <div className="factory-contact-row"><FaMobileAlt className="row-icon" /> {factory.celular}</div>}
            {(factory.endereco || factory.cidade) && (
              <div className="factory-contact-row">
                <FaMapMarkerAlt className="row-icon" /> {[factory.endereco, factory.bairro, factory.cidade, factory.estado]
                  .filter(Boolean)
                  .join(", ")}
                {factory.cep ? ` - CEP: ${factory.cep}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Dados de Atividade Econômica */}
        {(factory.porte || factory.atividadePrincipal || factory.naturezaJuridica || factory.dataAbertura) && (
          <div className="factory-hero" style={{ marginTop: '-0.5rem' }}>
            <div className="factory-hero-info" style={{ width: '100%' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaLandmark /> Atividade Econômica
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {factory.dataAbertura && (
                  <div className="factory-contact-row"><FaCalendarAlt className="row-icon" /> Abertura: {new Date(factory.dataAbertura).toLocaleDateString("pt-BR")}</div>
                )}
                {factory.porte && <div className="factory-contact-row"><FaChartBar className="row-icon" /> Porte: {factory.porte}</div>}
                {factory.naturezaJuridica && (
                  <div className="factory-contact-row"><FaBalanceScale className="row-icon" /> Natureza Jurídica: {factory.naturezaJuridica}</div>
                )}
              </div>
              {factory.atividadePrincipal && (
                <div className="factory-contact-row" style={{ marginTop: '8px' }}>
                  <FaIndustry className="row-icon" /> Atividade Principal: {factory.atividadePrincipal}
                </div>
              )}
              {factory.atividadeSecundaria && (
                <div className="factory-contact-row" style={{ marginTop: '4px', alignItems: 'flex-start' }}>
                  <FaBoxOpen className="row-icon" /> Atividades Secundárias: {factory.atividadeSecundaria}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Produtos */}
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem' }}><FaBoxOpen className="page-title-icon" /> Produtos da Fábrica</h1>
            <p>{factory.products.length} produto(s) cadastrado(s)</p>
          </div>
          <button
            className="btn btn-success"
            onClick={() => openProductModal(factory.id)}
            disabled={!factory.active}
            title={!factory.active ? "Ative a fábrica para adicionar produtos" : undefined}
          >
            <FaPlus /> Novo Produto
          </button>
        </div>

        {!factory.active && (
          <p style={{ color: "var(--color-text-muted)", marginTop: "-1rem", marginBottom: "1.5rem" }}>
            Esta fábrica está inativa. Reative-a para cadastrar novos produtos.
          </p>
        )}

        {factory.products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaBoxOpen /></div>
            <h3>Nenhum produto ainda</h3>
            <p>Clique em "Novo Produto" para adicionar</p>
          </div>
        ) : (
          <div className="products-grid">
            {factory.products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-name">{product.name}</div>
                <div className="product-code"><FaHashtag className="row-icon" /> Código: {product.code}</div>
                <p>
                  {product.unitPrice != null
                    ? `R$ ${product.unitPrice.toFixed(2)} (referência)`
                    : "Preço definido no pedido"}
                </p>
                <div className="product-tags">
                  {product.type && <span className="tag"><FaTag /> {product.type}</span>}
                </div>
                {product.observation && (
                  <p className="product-observation" style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                    <FaStickyNote className="row-icon" /> {product.observation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Produto */}
        {showProductModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProductModal(false); }}>
            <div className="modal">
              <div className="modal-header">
                <h2><FaBoxOpen className="modal-title-icon" /> Novo Produto</h2>
                <button className="modal-close" onClick={() => setShowProductModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleProductSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="p-name">Nome do Produto *</label>
                    <input id="p-name" type="text" name="name" value={newProduct.name}
                      onChange={handleProductChange} placeholder="Ex: Camiseta Polo" maxLength={MAX_PRODUCT_FIELD_LENGTH} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-code">Código do Produto *</label>
                    <input id="p-code" type="text" name="code" value={newProduct.code}
                      onChange={handleProductChange} placeholder="Ex: CAM-001" maxLength={MAX_PRODUCT_FIELD_LENGTH} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-price">Preço de Referência (Opcional)</label>
                    <div className="price-input-group">
                      <span className="price-prefix">R$</span>
                      <input id="p-price" type="text" name="unitPrice" value={priceInput}
                        onChange={handleProductChange} placeholder="0,00" />
                    </div>
                    <small className="cep-loading" style={{ color: "var(--color-text-muted)" }}>
                      O preço de venda real é informado ao adicionar o produto a um pedido, pois pode variar.
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Tipo do Produto</label>
                    <input
                      type="text"
                      name="type"
                      placeholder="Ex: Camiseta, Calça, etc."
                      value={newProduct.type}
                      onChange={handleProductChange}
                      maxLength={MAX_PRODUCT_FIELD_LENGTH}
                    />
                  </div>

                  <div className="form-group">
                    <label>Observação (Opcional)</label>
                    <input
                      type="text"
                      name="observation"
                      placeholder="Ex: Tamanho M, Tecido Algodão..."
                      value={newProduct.observation}
                      onChange={handleProductChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)} disabled={submittingProduct}>Cancelar</button>
                  <button type="submit" className="btn btn-success" disabled={submittingProduct}>
                    <FaCheck /> {submittingProduct ? "Salvando..." : "Salvar Produto"}
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

export default FactoryDetailsPage;
