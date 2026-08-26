import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { generateOrderPDF } from "../../utils/pdfGenerator";
import { notify } from "../../utils/notify";
import { applyCascadeDiscount } from "../../utils/discount";
import SendOrderEmailModal from "../../components/SendOrderEmailModal";
import {
  FaChartPie,
  FaCalendarDay,
  FaCalendarAlt,
  FaChartLine,
  FaBoxes,
  FaClipboardList,
  FaFilePdf,
  FaEnvelope,
} from "react-icons/fa";
import "./Dashboard.css";

interface OrderItemLike {
  quantity: number;
  unitPrice: number;
  discount?: string;
}

// Funções puras (não dependem de estado do componente), definidas fora
// para não precisarem entrar nas dependências do useEffect.
const calcOrderTotal = (items: OrderItemLike[]) =>
  items.reduce((s, i) => s + i.quantity * applyCascadeDiscount(i.unitPrice, i.discount), 0);

const calcTotals = (orders: { createdAt: string; items: OrderItemLike[] }[]) => {
  const now = new Date();
  let day = 0, month = 0, year = 0;
  orders.forEach((o) => {
    const total = calcOrderTotal(o.items);
    const d = new Date(o.createdAt);
    if (d.getFullYear() === now.getFullYear()) {
      year += total;
      if (d.getMonth() === now.getMonth()) {
        month += total;
        if (d.getDate() === now.getDate()) day += total;
      }
    }
  });
  return { day, month, year };
};

interface OrderItem {
  quantity: number;
  // Preço "congelado" no momento em que o pedido foi feito.
  unitPrice: number;
  product: { name: string; unitPrice: number | null };
  type?: string;
  observation?: string;
  discount?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  createdAt: string;
  buyerName: string;
  buyerPhone?: string;
  paymentMethod: string;
  items: OrderItem[];
  client: any;
  factory: any;
  seller: any;
  description?: string;
  freightType?: string;
}

const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ day: 0, month: 0, year: 0 });
  const [emailOrder, setEmailOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get("/orders")
      .then((res) => {
        const data: Order[] = res.data;
        setOrders(data);
        setTotals(calcTotals(data));
      })
      .catch((err) => {
        console.error("Erro ao buscar pedidos:", err);
        notify.apiError(err, "Não foi possível carregar os pedidos.");
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const getOrderSummary = (items: OrderItem[]) =>
    items.length === 1
      ? `${items[0].quantity}x ${items[0].product.name}`
      : `${items.length} produtos (${items.reduce((s, i) => s + i.quantity, 0)} itens)`;

  const getPaymentClass = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes("pix")) return "pix";
    if (m.includes("boleto")) return "boleto";
    if (m.includes("cartão") || m.includes("cartao")) return "cartao";
    return "prazo";
  };

  const handleViewPDF = (order: Order) => {
    generateOrderPDF({
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt).toLocaleDateString("pt-BR"),
      client: order.client,
      seller: order.seller,
      factory: order.factory,
      cart: order.items.map((i) => ({
        product: i.product as any,
        type: i.type,
        observation: i.observation,
        discount: i.discount,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      paymentMethod: order.paymentMethod,
      freightType: order.freightType,
      description: order.description || "",
      total: calcOrderTotal(order.items),
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <h1 className="dash-title"><FaChartPie className="dash-title-icon" /> Dashboard</h1>

        {/* Cards de vendas */}
        <div className="sales-cards">
          <div className="sales-card">
            <div className="sales-card-icon"><FaCalendarDay /></div>
            <div className="sales-card-label">Vendas de Hoje</div>
            <div className="sales-card-value">{fmt(totals.day)}</div>
          </div>
          <div className="sales-card">
            <div className="sales-card-icon"><FaCalendarAlt /></div>
            <div className="sales-card-label">Vendas do Mês</div>
            <div className="sales-card-value">{fmt(totals.month)}</div>
          </div>
          <div className="sales-card">
            <div className="sales-card-icon"><FaChartLine /></div>
            <div className="sales-card-label">Vendas do Ano</div>
            <div className="sales-card-value">{fmt(totals.year)}</div>
          </div>
          <div className="sales-card">
            <div className="sales-card-icon"><FaBoxes /></div>
            <div className="sales-card-label">Total de Pedidos</div>
            <div className="sales-card-value">{orders.length}</div>
          </div>
        </div>

        {/* Tabela de pedidos */}
        <div className="orders-section">
          <div className="orders-section-header">
            <FaClipboardList className="orders-section-icon" />
            <h2>Pedidos Recentes</h2>
          </div>

          {loading ? (
            <p className="no-orders-msg">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="no-orders-msg">Nenhum pedido cadastrado ainda.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Nº do Pedido</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Comprador</th>
                    <th>Fábrica</th>
                    <th>Produtos</th>
                    <th>Status PGTO</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><span className="order-number">{o.orderNumber}</span></td>
                      <td>{fmtDate(o.createdAt)}</td>
                      <td><strong>{o.client?.companyName}</strong></td>
                      <td>{o.buyerName || "—"}</td>
                      <td>{o.factory.name}</td>
                      <td>{getOrderSummary(o.items)}</td>
                      <td>
                        <span className={`payment-badge ${getPaymentClass(o.paymentMethod)}`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="order-total">{fmt(calcOrderTotal(o.items))}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            onClick={() => handleViewPDF(o)}
                            title="Ver PDF"
                          >
                            <FaFilePdf /> PDF
                          </button>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            onClick={() => setEmailOrder(o)}
                            title="Enviar por e-mail"
                          >
                            <FaEnvelope /> E-mail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {emailOrder && (
          <SendOrderEmailModal
            orderId={emailOrder.id}
            orderNumber={emailOrder.orderNumber}
            clientEmail={emailOrder.client?.email}
            clientName={emailOrder.client?.companyName || "Cliente"}
            factoryEmail={emailOrder.factory?.email}
            factoryName={emailOrder.factory?.name || "Fábrica"}
            onClose={() => setEmailOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;