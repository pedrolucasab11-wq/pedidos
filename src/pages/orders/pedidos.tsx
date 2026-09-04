import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import {
  generateOrderPDF,
  Factory,
  Client,
  Seller,
  CartItem,
} from "../../utils/pdfGenerator";
import { maskPhone } from "../../utils/masks";
import { notify } from "../../utils/notify";
import { applyCascadeDiscount } from "../../utils/discount";
import SendOrderEmailModal from "../../components/SendOrderEmailModal";
import OrderItemsEditor from "../../components/OrderItemsEditor";
import { PAYMENT_METHODS, isInstallmentPayment } from "../../utils/paymentMethods";
import {
  FaClipboardList,
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
  const [sellerName, setSellerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [description, setDescription] = useState("");
  const [freightType, setFreightType] = useState("CIF");

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{
    id: number;
    orderNumber: string;
    client: Client;
    factory: Factory;
  } | null>(null);

  useEffect(() => {
    // Buscar vendedor autenticado (pedidos são sempre criados em nome de quem está logado)
    api
      .get("/auth/me")
      .then((res) => {
        setCurrentSeller(res.data);
        // Pré-preenche com o nome de quem está logado, mas o campo continua
        // editável (pode ser outro vendedor da mesma representação/conta).
        setSellerName(res.data.name || "");
      })
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

  const getTotalValue = () =>
    cart.reduce((total, item) => {
      const unitPriceWithDiscount = applyCascadeDiscount(item.unitPrice, item.discount);
      const qty = Number(item.quantity) || 0;
      return total + unitPriceWithDiscount * qty;
    }, 0);

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
      sellerName: sellerName.trim(),
      paymentMethod,
      paymentTerms: isInstallmentPayment(paymentMethod) ? paymentTerms.trim() : "",
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
        const orderNumber = response.data.orderNumber || response.data.id || new Date().getTime().toString();
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
            sellerName: sellerName.trim(),
            paymentMethod,
            paymentTerms: isInstallmentPayment(paymentMethod) ? paymentTerms.trim() : "",
            freightType,
            description,
            total: getTotalValue(),
          });

          // Abre a confirmação de envio por e-mail (cliente/fábrica) depois do PDF.
          setCreatedOrder({
            id: response.data.id,
            orderNumber,
            client: selectedClientData,
            factory: selectedFactory,
          });
        }

        // Limpar formulário
        setCart([]);
        setBuyerName("");
        setBuyerPhone("");
        setPaymentTerms("");
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
                  setCart([]);
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
              <label>Vendedor</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Nome de quem está vendendo"
              />
              <small className="field-hint">Pré-preenchido com seu nome, mas pode ser alterado se outra pessoa estiver vendendo.</small>
            </div>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const value = e.target.value;
                  setPaymentMethod(value);
                  if (!isInstallmentPayment(value)) setPaymentTerms("");
                }}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            {isInstallmentPayment(paymentMethod) && (
              <div className="form-group">
                <label>Prazo do Boleto (dias)</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: 30/60/90"
                />
                <small className="field-hint">Informe os dias do boleto, separados por barra (ex: 30/60/90).</small>
              </div>
            )}
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

          <OrderItemsEditor
            factory={selectedFactory}
            cart={cart}
            onCartChange={setCart}
            freightType={freightType}
            onFreightTypeChange={setFreightType}
          />

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

        {/* Confirmação de envio do pedido por e-mail (cliente/fábrica) */}
        {createdOrder && (
          <SendOrderEmailModal
            orderId={createdOrder.id}
            orderNumber={createdOrder.orderNumber}
            clientEmail={createdOrder.client.email}
            clientName={createdOrder.client.companyName}
            factoryEmail={createdOrder.factory.email}
            factoryName={createdOrder.factory.name}
            onClose={() => setCreatedOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateOrderPage;
