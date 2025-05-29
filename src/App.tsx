import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/login";
import Pedidos from "./pages/orders/pedidos";
import DashboardPage from "./pages/dasboard/dashboard";
import FactoriesPage from "./pages/factories/factoriesPage";
import ClientsPage from "./pages/clients/ClientsPage";
import FactoryDetailsPage from "./pages/factoriesDetails/FactoryDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/fabricas" element={<FactoriesPage />} />
        <Route path="/factories/:id" element={<FactoryDetailsPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
