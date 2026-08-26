import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/login/login";
import RegisterPage from "./pages/register/RegisterPage";
import Pedidos from "./pages/orders/pedidos";
import EditOrderPage from "./pages/orders/EditOrderPage";
import DashboardPage from "./pages/dasboard/dashboard";
import FactoriesPage from "./pages/factories/factoriesPage";
import NewFactoryPage from "./pages/factories/NewFactoryPage";
import ClientsPage from "./pages/clients/ClientsPage";
import FactoryDetailsPage from "./pages/factoriesDetails/FactoryDetailsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
        <Route path="/pedidos/:id/editar" element={<ProtectedRoute><EditOrderPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/fabricas" element={<ProtectedRoute><FactoriesPage /></ProtectedRoute>} />
        <Route path="/fabricas/novo" element={<ProtectedRoute><NewFactoryPage /></ProtectedRoute>} />
        <Route path="/factories/:id" element={<ProtectedRoute><FactoryDetailsPage /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
