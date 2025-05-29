import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import "./Dashboard.css";

interface OrderItem {
  quantity: number;
  color: string;
  product: {
    name: string;
    unitPrice: number;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  createdAt: string;
  buyerName: string;
  paymentMethod: string;
  items: OrderItem[];
  client: {
    companyName: string;
  };
  factory: {
    name: string;
  };
}

interface SalesData {
  totalAmountMonth: number;
  totalAmountDay: number;
  totalAmountYear: number;
}

const DashboardPage: React.FC = () => {
  const [salesData, setSalesData] = useState({
    totalAmountMonth: 0,
    totalAmountDay: 0,
    totalAmountYear: 0,
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3333/orders")
      .then((response) => {
        const ordersData: Order[] = response.data;
        setOrders(ordersData);

        const totals = processSalesData(ordersData);
        setSalesData(totals);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar pedidos:", error);
        setLoading(false);
      });
  }, []);

  const processSalesData = (orders: Order[]): SalesData => {
    let totalAmountMonth = 0;
    let totalAmountDay = 0;
    let totalAmountYear = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();

    orders.forEach((order) => {
      const totalAmount = order.items.reduce(
        (sum, item) => sum + item.quantity * item.product.unitPrice,
        0
      );

      const orderDate = new Date(order.createdAt);
      const orderMonth = orderDate.getMonth();
      const orderDay = orderDate.getDate();
      const orderYear = orderDate.getFullYear();

      console.log(
        `Pedido ${
          order.id
        }: R$${totalAmount}, Data: ${orderDate.toLocaleDateString()}`
      );

      if (orderYear === currentYear) {
        totalAmountYear += totalAmount;

        if (orderMonth === currentMonth) {
          totalAmountMonth += totalAmount;

          if (orderDay === currentDay) {
            totalAmountDay += totalAmount;
          }
        }
      }
    });

    return {
      totalAmountMonth,
      totalAmountDay,
      totalAmountYear,
    };
  };

  const calculateOrderTotal = (items: OrderItem[]): number => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.product.unitPrice,
      0
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderSummary = (items: OrderItem[]): string => {
    if (items.length === 1) {
      return `${items[0].quantity}x ${items[0].product.name}`;
    }
    return `${items.length} produtos (${items.reduce((sum, item) => sum + item.quantity, 0)} itens)`;
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        
        <div className="sales-summary">
          <h2>Vendas Totais</h2>
          <div className="sales-cards">
            <div className="sales-card">
              <h3>Vendas do Mês</h3>
              <p>R${salesData.totalAmountMonth.toFixed(2)}</p>
            </div>
            <div className="sales-card">
              <h3>Vendas do Dia</h3>
              <p>R${salesData.totalAmountDay.toFixed(2)}</p>
            </div>
            <div className="sales-card">
              <h3>Vendas do Ano</h3>
              <p>R${salesData.totalAmountYear.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="orders-section">
          <h2>Pedidos Recentes</h2>
          {loading ? (
            <p>Carregando pedidos...</p>
          ) : (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Número do Pedido</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Comprador</th>
                    <th>Fábrica</th>
                    <th>Produtos</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((order) => (
                    <tr key={order.id}>
                      <td className="order-number">{order.orderNumber}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.client.companyName}</td>
                      <td>{order.buyerName || '-'}</td>
                      <td>{order.factory.name}</td>
                      <td className="products-summary">{getOrderSummary(order.items)}</td>
                      <td>
                        <span className={`payment-method ${order.paymentMethod.toLowerCase()}`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="order-total">
                        R${calculateOrderTotal(order.items).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {orders.length === 0 && (
                <p className="no-orders">Nenhum pedido encontrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;