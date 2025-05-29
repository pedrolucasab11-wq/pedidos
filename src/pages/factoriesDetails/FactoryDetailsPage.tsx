import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import "./FactoriesDetails.css";

interface Product {
  id: number;
  name: string;
  code: string;
  colors: string[];
  unitPrice: number;
}

interface Factory {
  id: number;
  logo: string;
  name: string;
  email: string;
  phone: string;
  products: Product[];
}

const FactoryDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    colors: [] as string[],
    unitPrice: 0,
    factoryId: 0,
  });
  const [colorInput, setColorInput] = useState("");
  const [priceInput, setPriceInput] = useState("");

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
      colors: [],
      unitPrice: 0,
      factoryId,
    });
    setPriceInput(""); // Reset do priceInput
    setShowProductModal(true);
  };

  useEffect(() => {
    axios
      .get(`https://backend-pedidos-i1qd.onrender.com/factories/${id}`)
      .then((res) => setFactory(res.data))
      .catch((err) => console.error("Erro ao buscar fábrica:", err));
  }, [id]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "unitPrice") {
      const rawValue = value.replace(/\D/g, "");
      const numericValue = parseFloat(rawValue) / 100;
      setPriceInput(
        numericValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
      );
      setNewProduct((prev) => ({ ...prev, unitPrice: numericValue }));
    } else {
      setNewProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addColor = () => {
    if (colorInput.trim() && !newProduct.colors.includes(colorInput.trim())) {
      setNewProduct((prev) => ({
        ...prev,
        colors: [...prev.colors, colorInput.trim()],
      }));
      setColorInput("");
    }
  };

  const removeColor = (colorToRemove: string) => {
    setNewProduct((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== colorToRemove),
    }));
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newProduct.name.trim() ||
      !newProduct.code.trim() ||
      newProduct.unitPrice <= 0
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    axios
      .post("https://backend-pedidos-i1qd.onrender.com/products", {
        ...newProduct,
      })
      .then(() => {
        alert("Produto cadastrado com sucesso!");
        setShowProductModal(false);
        setNewProduct({
          name: "",
          code: "",
          colors: [],
          unitPrice: 0,
          factoryId: 0,
        });
        setPriceInput("");
        setColorInput("");
        // Refresh
        return axios.get(`https://backend-pedidos-i1qd.onrender.com/factories/${id}`);
      })
      .then((res) => setFactory(res.data))
      .catch((err) => console.error("Erro:", err));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (!factory) return <div>Carregando...</div>;

  return (
    <div className="factory-details-container">
      <Sidebar />
      <div className="factory-details-content">
        <h1>{factory.name}</h1>
        <div className="factory-details">
          <img
            src={factory.logo}
            alt={factory.name}
            className="factory-logo-large"
          />
          <div>
            <p>
              <strong>Email:</strong> {factory.email}
            </p>
            <p>
              <strong>Telefone:</strong> {factory.phone}
            </p>
          </div>
        </div>

        <div className="products-section">
          <h2>Produtos</h2>
          <button
            className="btn-primary"
            onClick={() => openProductModal(factory.id)}
          >
            + Produto
          </button>
          {factory.products.length === 0 ? (
            <p>Nenhum produto cadastrado.</p>
          ) : (
            <div className="products-flex">
              {factory.products.map((product) => (
                <div key={product.id} className="product-item">
                  <h4>
                    {product.name} ({product.code})
                  </h4>
                  <p>Preço: {formatPrice(product.unitPrice)}</p>
                  <p>Cores: {product.colors.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {showProductModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Novo Produto</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowProductModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="modal-form">
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleProductChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Código</label>
                  <input
                    type="text"
                    name="code"
                    value={newProduct.code}
                    onChange={handleProductChange}
                    required
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Preço Unitário</label>
                  <input
                    type="text"
                    name="unitPrice"
                    value={priceInput}
                    onChange={handleProductChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cores</label>
                  <div className="colors-input">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={addColor}
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="colors-list">
                    {newProduct.colors.map((color, index) => (
                      <span key={index} className="color-tag">
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowProductModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactoryDetailsPage;
