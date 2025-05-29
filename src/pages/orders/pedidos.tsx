import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import "./Pedidos.css";

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
  name: string;
  logo: string;
  email: string;
  phone: string;
  products: Product[];
}

interface Client {
  id: number;
  companyName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cnpj?: string;
  stateInscr?: string;
  email?: string;
  phone?: string;
}

interface Seller {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface CartItem {
  product: Product;
  selectedColor: string;
  quantity: number;
}

// Função para gerar PDF melhorada
const generateOrderPDF = (orderData: {
  orderNumber: string;
  date: string;
  client: Client;
  seller: Seller;
  factory: Factory;
  cart: CartItem[];
  buyerName: string;
  paymentMethod: string;
  description: string;
  total: number;
}) => {
  const {
    orderNumber,
    date,
    client,
    seller,
    factory,
    cart,
    buyerName,
    paymentMethod,
    description,
    total,
  } = orderData;

  // Criar uma nova janela para o PDF
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const pdfHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Pedido ${orderNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #333;
                background: white;
                padding: 20px;
                max-width: 210mm;
                margin: 0 auto;
            }
            
            /* Header com 3 colunas */
            .header-section {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #000;
            }
            
            .header-column {
                padding: 10px;
            }
            
            .header-column h3 {
                font-size: 12px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                text-transform: uppercase;
                border-bottom: 1px solid #ccc;
                padding-bottom: 3px;
            }
            
            .header-info {
                font-size: 10px;
                line-height: 1.3;
            }
            
            .header-info div {
                margin-bottom: 2px;
            }
            
            /* Dados do pedido - canto superior direito */
            .order-info {
                text-align: right;
                font-weight: bold;
                font-size: 12px;
            }
            
            .order-info .order-number {
                font-size: 16px;
                color: #000;
                margin-bottom: 5px;
            }
            
            .order-info .order-date {
                font-size: 12px;
                color: #666;
            }
            
            /* Título principal */
            .main-title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                text-transform: uppercase;
                margin: 20px 0;
                padding: 10px;
                background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
                border: 2px solid #000;
                letter-spacing: 1px;
            }
            
            /* Seção do cliente */
            .client-section {
                margin-bottom: 20px;
                border: 1px solid #000;
                padding: 15px;
                background: #fafafa;
            }
            
            .client-title {
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
                color: #000;
            }
            
            .client-info {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 20px;
                font-size: 10px;
                line-height: 1.4;
            }
            
            .client-main-info h4 {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #000;
            }
            
            .info-line {
                margin-bottom: 4px;
                display: flex;
                align-items: flex-start;
            }
            
            .info-label {
                font-weight: bold;
                min-width: 80px;
                margin-right: 8px;
                color: #555;
            }
            
            .info-value {
                flex: 1;
                color: #000;
            }
            
            /* Seção de produtos */
            .products-section {
                margin-bottom: 20px;
            }
            
            .products-title {
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 15px;
                padding: 8px 0;
                border-bottom: 2px solid #000;
                text-align: center;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                margin-bottom: 15px;
            }
            
            .products-table th {
                background: linear-gradient(135deg, #4a4a4a, #2a2a2a);
                color: white;
                font-weight: bold;
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #000;
                font-size: 10px;
                text-transform: uppercase;
            }
            
            .products-table td {
                padding: 8px;
                border: 1px solid #ccc;
                text-align: center;
                background: white;
            }
            
            .products-table tr:nth-child(even) td {
                background: #f9f9f9;
            }
            
            .products-table tr:hover td {
                background: #f0f8ff;
            }
            
            .product-name {
                text-align: left !important;
                font-weight: bold;
                color: #000;
            }
            
            .text-right {
                text-align: right !important;
            }
            
            .text-center {
                text-align: center !important;
            }
            
            /* Seção inferior com descrição e totais */
            .bottom-section {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 30px;
                margin-top: 20px;
            }
            
            .description-section {
                border: 1px solid #ccc;
                padding: 15px;
                background: #fafafa;
                min-height: 120px;
            }
            
            .description-title {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 10px;
                color: #000;
                text-transform: uppercase;
            }
            
            .description-content {
                font-size: 10px;
                line-height: 1.4;
                color: #333;
            }
            
            .totals-section {
                border: 1px solid #000;
                background: white;
            }
            
            .totals-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .totals-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #ccc;
                font-size: 11px;
            }
            
            .totals-table .label {
                font-weight: bold;
                background: #f0f0f0;
                text-transform: uppercase;
                color: #333;
                border-right: 1px solid #ccc;
            }
            
            .totals-table .value {
                text-align: right;
                font-weight: bold;
                color: #000;
                background: white;
            }
            
            .totals-table tr:last-child td {
                background: #2a2a2a;
                color: white;
                font-weight: bold;
                font-size: 12px;
                border-bottom: none;
            }
            
            /* Responsividade para impressão */
            @media print {
                body { 
                    margin: 0; 
                    padding: 15px;
                    font-size: 10px;
                }
                
                .header-section {
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                }
                
                .client-info {
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 15px;
                }
                
                .bottom-section {
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                }
            }
            
            /* Melhorias visuais */
            .company-name {
                font-size: 11px !important;
                font-weight: bold;
                color: #000;
            }
            
            .contact-info {
                color: #666;
                font-size: 9px;
            }
            
            .highlight {
                background: #ffffcc;
                padding: 2px 4px;
                border-radius: 2px;
            }
        </style>
    </head>
    <body>
        <!-- Header com 3 colunas -->
        <div class="header-section">
            <!-- Dados do Vendedor -->
            <div class="header-column">
                <h3>Representante</h3>
                <div class="header-info">
                    <div class="company-name">${seller.name || ""}</div>
                    <div class="contact-info">${seller.email || ""}</div>
                    <div class="contact-info">${seller.phone || ""}</div>
                </div>
            </div>
            
            <!-- Dados da Fábrica -->
            <div class="header-column">
                <h3>Fábricante</h3>
                <div class="header-info">
                    <div class="company-name">${factory.name}</div>
                    <div class="contact-info">${factory.email || ""}</div>
                    <div class="contact-info">${factory.phone || ""}</div>
                </div>
            </div>
            
            <!-- Dados do Pedido -->
            <div class="header-column">
                <div class="order-info">
                    <div class="order-number">${orderNumber}</div>
                    <div class="order-date">DATA ${date}</div>
                </div>
            </div>
        </div>
        
        <!-- Título Principal -->
        <div class="main-title">PEDIDO DE VENDA</div>
        
        <!-- Seção do Cliente -->
        <div class="client-section">
            <div class="client-title">CLIENTE</div>
            <div class="client-info">
                <!-- Informações principais do cliente -->
                <div class="client-main-info">
                    <h4>${client.companyName || ""}</h4>
                    <div class="info-line">
                        <span class="info-label">ENDEREÇO:</span>
                        <span class="info-value">${client.address || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">CNPJ:</span>
                        <span class="info-value">${client.cnpj || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">INSC.ESTADUAL:</span>
                        <span class="info-value">${
                          client.stateInscr || ""
                        }</span>
                    </div>
                </div>
                
                <!-- Dados de contato -->
                <div class="client-contact">
                    <div class="info-line">
                        <span class="info-label">TEL.CLIENTE:</span>
                        <span class="info-value">${client.phone || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">E-MAIL:</span>
                        <span class="info-value">${client.email || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">COMPRADOR:</span>
                        <span class="info-value">${buyerName || ""}</span>
                    </div>
                </div>
                
                <!-- Dados comerciais -->
                <div class="client-commercial">
                    <div class="info-line">
                        <span class="info-label">VENDEDOR:</span>
                        <span class="info-value">${seller.name}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">FORMA PGTO:</span>
                        <span class="info-value">${paymentMethod}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Seção de Produtos -->
        <div class="products-section">
            <div class="products-title">PRODUTOS</div>
            <table class="products-table">
                <thead>
                    <tr>
                        <th style="width: 35%;">PRODUTO</th>
                        <th style="width: 8%;">QUANT.</th>
                        <th style="width: 12%;">UNIT.</th>
                        <th style="width: 12%;">DESCONTOS</th>
                        <th style="width: 12%;">C/DESC.</th>
                        <th style="width: 15%;">SUB-TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${cart
                      .map(
                        (item) => `
                        <tr>
                            <td class="product-name">
                                <strong>${item.product.name}</strong><br>
                                <small>Código: ${item.product.code}</small><br>
                                <small>Cor: <span class="highlight">${
                                  item.selectedColor
                                }</span></small>
                            </td>
                            <td class="text-center"><strong>${
                              item.quantity
                            }</strong></td>
                            <td class="text-right">R$ ${item.product.unitPrice.toFixed(
                              2
                            )}</td>
                            <td class="text-right">0,00</td>
                            <td class="text-right">R$ ${item.product.unitPrice.toFixed(
                              2
                            )}</td>
                            <td class="text-right"><strong>R$ ${(
                              item.product.unitPrice * item.quantity
                            ).toFixed(2)}</strong></td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <!-- Seção Inferior: Descrição e Totais -->
        <div class="bottom-section">
            <!-- Descrição -->
            <div class="description-section">
                <div class="description-title">Observações</div>
                <div class="description-content">
                    ${description || "Nenhuma observação adicional."}
                </div>
            </div>
            
            <!-- Totais -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Total dos Produtos</td>
                        <td class="value">R$ ${total.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">Adicional (+/-)</td>
                        <td class="value">0,00</td>
                    </tr>
                    <tr>
                        <td class="label">Valor IPI</td>
                        <td class="value">0,00</td>
                    </tr>
                    <tr>
                        <td class="label">Valor ST</td>
                        <td class="value">0,00</td>
                    </tr>
                    <tr>
                        <td class="label">Total + IPI + ST</td>
                        <td class="value">R$ ${total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            });
        </script>
    </body>
    </html>
  `;

  printWindow.document.write(pdfHTML);
  printWindow.document.close();
};

const CreateOrderPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<number | null>(null);

  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [description, setDescription] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Buscar vendedores
    axios
      .get("https://backend-pedidos-i1qd.onrender.com/sellers")
      .then((res) => setSellers(res.data))
      .catch((err) => console.error("Erro ao buscar vendedores:", err));

    // Buscar fábricas (com produtos inclusos)
    axios
      .get("https://backend-pedidos-i1qd.onrender.com/factories")
      .then((res) => setFactories(res.data))
      .catch((err) => console.error("Erro ao buscar fábricas:", err));

    // Buscar clientes
    axios
      .get("https://backend-pedidos-i1qd.onrender.com/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error("Erro ao buscar clientes:", err));
  }, []);

  const filteredProducts = selectedFactory
    ? selectedFactory.products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0] || "");
    setQuantity(1);
    setShowProductModal(true);
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedColor) return;

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.product.id === selectedProduct.id &&
        item.selectedColor === selectedColor
    );

    if (existingItemIndex >= 0) {
      // Se já existe, apenas atualiza a quantidade
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Adiciona novo item
      const newItem: CartItem = {
        product: selectedProduct,
        selectedColor,
        quantity,
      };
      setCart([...cart, newItem]);
    }

    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const updateCartItem = (
    index: number,
    field: "quantity" | "color",
    value: string | number
  ) => {
    const updatedCart = [...cart];
    if (field === "quantity") {
      updatedCart[index].quantity = Math.max(1, Number(value));
    } else if (field === "color") {
      updatedCart[index].selectedColor = String(value);
    }
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const getTotalValue = () => {
    return cart.reduce((total, item) => {
      return total + item.product.unitPrice * item.quantity;
    }, 0);
  };

  const handleSubmit = () => {
    if (
      !selectedSeller ||
      !selectedFactory ||
      !selectedClient ||
      cart.length === 0
    ) {
      alert(
        "Por favor, preencha todos os campos obrigatórios e adicione pelo menos um produto."
      );
      return;
    }

    const data = {
      sellerId: selectedSeller,
      factoryId: selectedFactory.id,
      clientId: selectedClient,
      buyerName,
      paymentMethod,
      description,
      products: cart.map((item) => ({
        productId: item.product.id,
        color: item.selectedColor,
        quantity: item.quantity,
      })),
    };

    axios
      .post("https://backend-pedidos-i1qd.onrender.com/orders", data)
      .then((response) => {
        alert("Pedido criado com sucesso!");

        // Gerar PDF do pedido
        const orderNumber = response.data.id || new Date().getTime().toString();
        const selectedSellerData = sellers.find((s) => s.id === selectedSeller);
        const selectedClientData = clients.find((c) => c.id === selectedClient);

        if (selectedSellerData && selectedClientData && selectedFactory) {
          generateOrderPDF({
            orderNumber,
            date: new Date().toLocaleDateString("pt-BR"),
            client: selectedClientData,
            seller: selectedSellerData,
            factory: selectedFactory,
            cart,
            buyerName,
            paymentMethod,
            description,
            total: getTotalValue(),
          });
        }

        // Limpar formulário
        setCart([]);
        setBuyerName("");
        setDescription("");
        setSelectedSeller(null);
        setSelectedFactory(null);
        setSelectedClient(null);
      })
      .catch((err) => {
        console.error("Erro ao criar pedido:", err);
        alert("Erro ao criar pedido. Tente novamente.");
      });
  };

  return (
    <div className="orders-container">
      <Sidebar />
      <div className="orders-content">
        <div className="orders-header">
          <h1>Criar Novo Pedido</h1>
        </div>

        <div className="orders-form">
          {/* Seção 1: Informações Básicas */}
          <div className="form-section">
            <h2>Informações do Pedido</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Selecione o Vendedor *</label>
                <select
                  value={selectedSeller || ""}
                  onChange={(e) => setSelectedSeller(Number(e.target.value))}
                  required
                >
                  <option value="">Selecione o vendedor</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </div>
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
                    const factory = factories.find(
                      (f) => f.id === parseInt(e.target.value)
                    );
                    setSelectedFactory(factory || null);
                  }}
                  required
                >
                  <option value="">Selecione uma fábrica</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name} ({factory.products.length} produto
                      {factory.products.length !== 1 ? "s" : ""})
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
          </div>

          {/* Seção 3: Produtos */}
          {selectedFactory && (
            <div className="form-section">
              <h2>Produtos - {selectedFactory.name}</h2>
              <div className="products-search">
                <input
                  type="text"
                  placeholder="Buscar por nome ou código do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-code">Código: {product.code}</p>
                      <p className="product-price">
                        R$ {product.unitPrice.toFixed(2)}
                      </p>
                      <p className="product-colors">
                        Cores: {product.colors.join(", ")}
                      </p>
                    </div>
                    <button
                      className="btn-add-product"
                      onClick={() => openProductModal(product)}
                    >
                      Adicionar ao Pedido
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 4: Carrinho */}
          {cart.length > 0 && (
            <div className="form-section">
              <h2>Itens do Pedido ({cart.length})</h2>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <p>Código: {item.product.code}</p>
                      <p>
                        Preço unitário: R$ {item.product.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="control-group">
                        <label>Cor:</label>
                        <select
                          value={item.selectedColor}
                          onChange={(e) =>
                            updateCartItem(index, "color", e.target.value)
                          }
                        >
                          {item.product.colors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="control-group">
                        <label>Qtd:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(index, "quantity", e.target.value)
                          }
                        />
                      </div>
                      <div className="control-group">
                        <span className="item-total">
                          R${" "}
                          {(item.product.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          className="btn-remove"
                          onClick={() => removeFromCart(index)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <h3>Total do Pedido: R$ {getTotalValue().toFixed(2)}</h3>
              </div>
            </div>
          )}

          {/* Botão de Finalizar */}
          <div className="form-actions">
            <button
              className="btn-primary btn-large"
              onClick={handleSubmit}
              disabled={cart.length === 0}
            >
              Criar Pedido
            </button>
          </div>
        </div>

        {/* Modal de Adicionar Produto */}
        {showProductModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Adicionar Produto</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowProductModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="product-details">
                  <h4>{selectedProduct.name}</h4>
                  <p>Código: {selectedProduct.code}</p>
                  <p>Preço: R$ {selectedProduct.unitPrice.toFixed(2)}</p>
                </div>
                <div className="form-group">
                  <label>Cor:</label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  >
                    {selectedProduct.colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantidade:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="modal-total">
                  <strong>
                    Total: R${" "}
                    {(selectedProduct.unitPrice * quantity).toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-ghost"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancelar
                </button>
                <button className="btn-primary" onClick={addToCart}>
                  Adicionar ao Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderPage;
