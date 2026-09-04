import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { Factory, Client, CartItem } from "../../utils/pdfGenerator";
import { maskPhone } from "../../utils/masks";
import { notify } from "../../utils/notify";
import OrderItemsEditor from "../../components/OrderItemsEditor";
import { PAYMENT_METHODS, isInstallmentPayment } from "../../utils/paymentMethods";
import { FaArrowLeft, FaClipboardList, FaCheck } from "react-icons/fa";
import "./Pedidos.css";

const EditOrderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [factory, setFactory] = useState<Factory | null>(null);
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

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Clientes ativos (o cliente atual do pedido pode estar inativo; garantimos
    // que ele apareça na lista mesmo assim, para não "desaparecer" da seleção).
    api
      .get("/clients")
      .then((res) => setClients(res.data))
      .catch((err) => {
        console.error("Erro ao buscar clientes:", err);
        notify.apiError(err, "Não foi possível carregar a lista de clientes.");
      });

    api
      .get(`/orders/${id}`)
      .then((res) => {
        const order = res.data;
        setOrderNumber(order.orderNumber);
        setFactory(order.factory);
        setSelectedClient(order.clientId);
        setBuyerName(order.buyerName || "");
        setBuyerPhone(order.buyerPhone || "");
        setSellerName(order.sellerName || order.seller?.name || "");
        setPaymentMethod(order.paymentMethod || "PIX");
        setPaymentTerms(order.paymentTerms || "");
        setDescription(order.description || "");
        setFreightType(order.freightType || "CIF");
        setCart(
          order.items.map((item: any) => ({
            product: item.product,
            type: item.type || "",
            observation: item.observation || "",
            discount: item.discount || "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        );
      })
      .catch((err) => {
        console.error("Erro ao carregar pedido:", err);
        notify.apiError(err, "Não foi possível carregar este pedido.");
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = () => {
    if (!selectedClient || cart.length === 0) {
      notify.warning(
        "Por favor, preencha todos os campos obrigatórios e mantenha pelo menos um produto no pedido."
      );
      return;
    }

    const data = {
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

    setSubmitting(true);
    api
      .put(`/orders/${id}`, data)
      .then(() => {
        notify.success("Pedido atualizado com sucesso!");
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Erro ao atualizar pedido:", err);
        notify.apiError(err, "Erro ao atualizar pedido. Tente novamente.");
      })
      .finally(() => setSubmitting(false));
  };

  if (loadError) {
    return (
      <div className="orders-container">
        <Sidebar />
        <div className="orders-content" style={{ padding: '2.5rem' }}>
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Voltar ao Dashboard
          </button>
          <div className="empty-state">
            <div className="empty-icon"><FaClipboardList /></div>
            <h3>Não foi possível carregar este pedido</h3>
            <p>Verifique sua conexão ou tente novamente mais tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-container">
        <Sidebar />
        <div className="orders-content" style={{ padding: '2.5rem' }}>
          <p className="loading-text">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <Sidebar />
      <div className="orders-content" style={{ padding: '2.5rem' }}>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <FaArrowLeft /> Voltar ao Dashboard
        </button>

        <div className="page-header">
          <div>
            <h1><FaClipboardList className="page-title-icon" /> Editar Pedido {orderNumber}</h1>
            <p>Fábrica: {factory?.name} (não é possível trocar a fábrica de um pedido existente)</p>
          </div>
        </div>

        <div className="orders-form">
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

          <div className="form-row">
            <div className="form-group">
              <label>Vendedor</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Nome de quem está vendendo"
              />
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
            factory={factory}
            cart={cart}
            onCartChange={setCart}
            freightType={freightType}
            onFreightTypeChange={setFreightType}
          />

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '1.1rem', padding: '0 24px', height: '64px' }}
              onClick={() => navigate("/dashboard")}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              className="btn btn-success"
              style={{ fontSize: '1.2rem', padding: '0 30px', height: '64px' }}
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
            >
              <FaCheck /> {submitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderPage;
