import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import {
  generateOrderPDF,
  Product,
  Factory,
  Client,
  Seller,
  CartItem,
} from "../../utils/pdfGenerator";
import { maskPhone, maskCurrency } from "../../utils/masks";
import { notify } from "../../utils/notify";
import { applyCascadeDiscount } from "../../utils/discount";
import {
  FaClipboardList,
  FaBoxOpen,
  FaSearch,
  FaHashtag,
  FaTag,
  FaStickyNote,
  FaPlus,
  FaShoppingCart,
  FaTrash,
  FaTruck,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import "./Pedidos.css";

const CreateOrderPage: React.FC = () => {
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);

  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [description, setDescription] = useState("");
  const [freightType, setFreightType] = useState("CIF");

  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [type, setType] = useState("");
  const [observation, setObservation] = useState("");
  const [discount, setDiscount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    // Buscar vendedor autenticado (pedidos são sempre criados em nome de quem está logado)
    api
      .get("/auth/me")
      .then((res) => setCurrentSeller(res.data))
      .catch((err) => {
        console.error("Erro ao buscar vendedor:", err);
        notify.apiError(err, "Não foi possível carregar seus dados de vendedor.");
      });

    // Buscar fábricas (com produtos inclusos)
    api
      .get("/factories")
      .then((res) => setFactories(res.data.filter((f: any) => f.active !== false)))
      .catch((err) => {
        console.error("Erro ao buscar fábricas:", err);
        notify.apiError(err, "Não foi possível carregar a lista de fábricas.");
      });

    // Buscar clientes
    api
      .get("/clients")
      .then((res) => setClients(res.data.filter((c: any) => c.active !== false)))
      .catch((err) => {
        console.error("Erro ao buscar clientes:", err);
        notify.apiError(err, "Não foi possível carregar a lista de clientes.");
      });
  }, []);

  const filteredProducts = selectedFactory
    ? (selectedFactory.products || []).filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setType(product.type || "");
    setObservation(product.observation || "");
    setDiscount("");
    setQuantity(1);
    // Pré-preenche com o preço de referência do produto, se houver, mas o
    // valor final é sempre definido aqui, pois pode variar por negociação.
    setUnitPriceInput(product.unitPrice != null ? maskCurrency(product.unitPrice) : "");
    setShowProductModal(true);
  };

  const parseUnitPriceInput = (value: string) => {
    const numeric = parseFloat(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnitPriceInput(maskCurrency(e.target.value));
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const unitPrice = parseUnitPriceInput(unitPriceInput);
    if (unitPrice <= 0) {
      notify.warning("Informe o valor unitário do produto.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      notify.warning("Informe uma quantidade válida.");
      return;
    }

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.product.id === selectedProduct.id &&
        item.type === type &&
        item.observation === observation &&
        item.discount === discount &&
        item.unitPrice === unitPrice
    );

    if (existingItemIndex >= 0) {
      // Se já existe, apenas atualiza a quantidade
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += Number(quantity);
      setCart(updatedCart);
    } else {
      // Adiciona novo item
      const newItem: CartItem = {
        product: selectedProduct,
        type,
        observation,
        discount,
        quantity: Number(quantity),
        unitPrice,
      };
      setCart([...cart, newItem]);
    }

    setShowProductModal(false);
    setSelectedProduct(null);
    setUnitPriceInput("");
  };

  const updateCartItem = (
    index: number,
    field: "quantity" | "type" | "observation" | "discount" | "unitPrice",
    value: string | number
  ) => {
    const updatedCart = [...cart];
    if (field === "quantity") {
      updatedCart[index].quantity = value as any;
    } else if (field === "type") {
      updatedCart[index].type = String(value);
    } else if (field === "observation") {
      updatedCart[index].observation = String(value);
    } else if (field === "discount") {
      updatedCart[index].discount = String(value);
    } else if (field === "unitPrice") {
      updatedCart[index].unitPrice = Number(value) || 0;
    }
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const getTotalValue = () => {
    return cart.reduce((total, item) => {
      const unitPriceWithDiscount = applyCascadeDiscount(item.unitPrice, item.discount);
      const qty = Number(item.quantity) || 0;
      return total + (unitPriceWithDiscount * qty);
    }, 0);
  };

  const handleSubmit = () => {
    if (
      !selectedFactory ||
      !selectedClient ||
      cart.length === 0
    ) {
      notify.warning(
        "Por favor, preencha todos os campos obrigatórios e adicione pelo menos um produto."
      );
      return;
    }

    const data = {
      factoryId: selectedFactory.id,
      clientId: selectedClient,
      buyerName,
      buyerPhone,
      paymentMethod,
      description,
      freightType,
      products: cart.map((item) => ({
        productId: item.product.id,
        type: item.type,
        observation: item.observation,
        discount: item.discount,
        quantity: Number(item.quantity) || 1,
        unitPrice: item.unitPrice,
      })),
    };

    setSubmittingOrder(true);
    api
      .post("/orders", data)
      .then((response) => {
        notify.success("Pedido criado com sucesso!");

        // Gerar PDF do pedido
        const orderNumber = response.data.id || new Date().getTime().toString();
        const selectedClientData = clients.find((c) => c.id === selectedClient);

        if (currentSeller && selectedClientData && selectedFactory) {
          generateOrderPDF({
            orderNumber,
            date: new Date().toLocaleDateString("pt-BR"),
            client: selectedClientData,
            seller: currentSeller,
            factory: selectedFactory,
            cart,
            buyerName,
            buyerPhone,
            paymentMethod,
            freightType,
            description,
            total: getTotalValue(),
          });
        }

        // Limpar formulário
        setCart([]);
        setBuyerName("");
        setBuyerPhone("");
        setDescription("");
        setSelectedFactory(null);
        setSelectedClient(null);
      })
      .catch((err) => {
        console.error("Erro ao criar pedido:", err);
        notify.apiError(err, "Erro ao criar pedido. Tente novamente.");
      })
      .finally(() => setSubmittingOrder(false));
  };

  return (
    <div className="orders-container">
      <Sidebar />
      <div className="orders-content" style={{ padding: '2.5rem' }}>
        <div className="page-header">
          <div>
            <h1><FaClipboardList className="page-title-icon" /> Criar Novo Pedido</h1>
            <p>Selecione as opções e adicione produtos ao carrinho</p>
          </div>
        </div>

        <div className="orders-form">
          {/* Seção 1: Informações Básicas */}
          <div className="section-divider"><FaClipboardList /> Informações do Pedido</div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Selecione o Cliente *</label>
              <select
                value={selectedClient || ""}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                required
              >
                <option value="">Selecione o cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Selecione a Fábrica *</label>
              <select
                value={selectedFactory?.id || ""}
                onChange={(e) => {
                  const factory = factories.find((f) => f.id === parseInt(e.target.value));
                  setSelectedFactory(factory || null);
                }}
                required
              >
                <option value="">Selecione uma fábrica</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name} ({factory.products?.length || 0} itens)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nome do Comprador</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nome da pessoa responsável"
              />
            </div>
            <div className="form-group">
              <label>Telefone do Comprador</label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="PIX">PIX</option>
                <option value="Boleto">Boleto</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informações adicionais sobre o pedido..."
              rows={3}
            />
          </div>

          {/* Seção 3: Produtos */}
          {selectedFactory && (
            <>
              <div className="section-divider"><FaBoxOpen /> Produtos da Fábrica: {selectedFactory.name}</div>
              <div className="search-bar" style={{ maxWidth: '600px' }}>
                <FaSearch className="search-bar-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou código do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-name">{product.name}</div>
                    <div className="product-code"><FaHashtag className="row-icon" /> Código: {product.code}</div>
                    <div className="product-price">
                      {product.unitPrice != null ? `R$ ${product.unitPrice.toFixed(2)} (referência)` : "Sem preço de referência"}
                    </div>
                    <div className="product-tags" style={{ marginBottom: '1rem' }}>
                      {product.type && <span className="tag"><FaTag /> {product.type}</span>}
                    </div>
                    {product.observation && (
                      <p className="product-observation" style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', marginBottom: '10px' }}>
                        <FaStickyNote className="row-icon" /> {product.observation}
                      </p>
                    )}
                    
                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => openProductModal(product)}
                    >
                      <FaPlus /> Adicionar ao Pedido
                    </button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p style={{ color: '#666', gridColumn: '1 / -1' }}>Nenhum produto encontrado na busca.</p>
                )}
              </div>
            </>
          )}

          {/* Seção 4: Carrinho */}
          {cart.length > 0 && (
            <>
              <div className="section-divider" style={{ marginTop: '2rem' }}><FaShoppingCart /> Itens do Pedido ({cart.length})</div>
              <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cart.map((item, index) => (
                  <div key={index} className="client-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <strong style={{ fontSize: '1.2rem' }}>{item.product.name}</strong>
                      <span style={{ color: '#666' }}>Código: {item.product.code}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div className="form-group" style={{ marginBottom: 0, width: '110px' }}>
                        <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Valor Unit. (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateCartItem(index, "unitPrice", e.target.value)}
                          style={{ height: '40px', fontSize: '0.9rem', padding: '0 10px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Desconto</label>
                        <input
                          type="text"
                          value={item.discount || ""}
                          onChange={(e) => updateCartItem(index, "discount", e.target.value)}
                          style={{ height: '40px', fontSize: '0.9rem', padding: '0 10px', width: '100px' }}
                          placeholder="Ex: 10 / 5"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Obs / Tipo</label>
                        <input
                          type="text"
                          value={item.observation || ""}
                          onChange={(e) => updateCartItem(index, "observation", e.target.value)}
                          style={{ height: '40px', fontSize: '0.9rem', padding: '0 10px', width: '120px' }}
                          placeholder="Detalhes..."
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0, width: '80px' }}>
                        <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Qtd</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                          style={{ height: '40px', fontSize: '1rem', padding: '0 10px' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '120px' }}>
                        <strong style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>
                          R$ {(applyCascadeDiscount(item.unitPrice, item.discount) * (Number(item.quantity) || 0)).toFixed(2)}
                        </strong>
                        <button
                          className="btn btn-ghost"
                          onClick={() => removeFromCart(index)}
                          style={{ color: '#c0172a', padding: '5px 10px', height: 'auto', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FaTrash /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total" style={{ textAlign: 'right', marginTop: '20px', fontSize: '1.5rem', background: '#fff', padding: '20px', borderRadius: '12px', border: '2px dashed var(--color-primary-dark)' }}>
                <strong>Total Geral: R$ {getTotalValue().toFixed(2)}</strong>
              </div>
            </>
          )}

          {/* Seção 5: Frete */}
          <div className="section-divider" style={{ marginTop: '2rem' }}><FaTruck /> Opções de Frete</div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="freight"
                  value="CIF"
                  checked={freightType === "CIF"}
                  onChange={(e) => setFreightType(e.target.value)}
                  style={{ width: '24px', height: '24px' }}
                />
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>CIF</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="freight"
                  value="FOB"
                  checked={freightType === "FOB"}
                  onChange={(e) => setFreightType(e.target.value)}
                  style={{ width: '24px', height: '24px' }}
                />
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>FOB</span>
              </label>
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
              <strong>CIF (Cost, Insurance and Freight):</strong> O fornecedor é responsável por todos os custos e riscos até a entrega.<br/>
              <strong>FOB (Free On Board):</strong> O comprador assume os custos e riscos do transporte a partir do embarque.
            </p>
          </div>

          {/* Botão de Finalizar */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-success"
              style={{ fontSize: '1.2rem', padding: '0 30px', height: '64px' }}
              onClick={handleSubmit}
              disabled={cart.length === 0 || submittingOrder}
            >
              <FaCheck /> {submittingOrder ? "Enviando..." : "Finalizar e Gerar PDF"}
            </button>
          </div>
        </div>

        {/* Modal de Adicionar Produto */}
        {showProductModal && selectedProduct && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProductModal(false); }}>
            <div className="modal" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2><FaBoxOpen className="modal-title-icon" /> Adicionar ao Pedido</h2>
                <button className="modal-close" onClick={() => setShowProductModal(false)}><FaTimes /></button>
              </div>
              
              <div className="modal-body">
                <div style={{ background: 'var(--color-bg)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{selectedProduct.name}</h4>
                  <p style={{ margin: 0, color: '#666' }}>Código: {selectedProduct.code}</p>
                  {selectedProduct.unitPrice != null && (
                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                      Preço de referência: R$ {selectedProduct.unitPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-unit-price">Valor Unitário (R$) *</label>
                    <div className="price-input-group">
                      <span className="price-prefix">R$</span>
                      <input
                        id="modal-unit-price"
                        type="text"
                        value={unitPriceInput}
                        onChange={handleUnitPriceChange}
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-quantity">Quantidade *</label>
                    <input
                      id="modal-quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? ("" as any) : Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Desconto (%) - Ex: 10 / 5 / 2</label>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Observação</label>
                  <input
                    type="text"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
                </div>

                <div style={{ textAlign: 'right', fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: '15px 0 5px 0' }}>
                  <strong>Total: R$ {(applyCascadeDiscount(parseUnitPriceInput(unitPriceInput), discount) * (Number(quantity) || 0)).toFixed(2)}</strong>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowProductModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={addToCart}><FaPlus /> Confirmar Item</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderPage;
