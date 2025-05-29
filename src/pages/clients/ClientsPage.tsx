import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import "./Clients.css";

interface Client {
  id: number;
  companyName: string;
  cnpj: string;
  stateInscr: string;
  email: string;
  address: string;
  phone: string;
}

interface NewClient {
  companyName: string;
  cnpj: string;
  stateInscr: string;
  email: string;
  address: string;
  phone: string;
}

interface AddressForm {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState<NewClient>({
    companyName: "",
    cnpj: "",
    stateInscr: "",
    email: "",
    address: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState<AddressForm>({
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
  });

  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const fetchClients = () => {
    axios
      .get("https://backend-pedidos-i1qd.onrender.com/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error("Erro ao buscar clientes:", err));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatCEP = (cep: string) => {
    return cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    const formattedCEP = formatCEP(cep);

    setAddressForm((prev) => ({ ...prev, cep: formattedCEP }));

    if (cep.length === 8) {
      setIsLoadingCEP(true);
      try {
        const response = await axios.get<ViaCEPResponse>(
          `https://viacep.com.br/ws/${cep}/json/`
        );

        if (response.data && !response.data.erro) {
          setAddressForm((prev) => ({
            ...prev,
            street: response.data.logradouro || "",
            neighborhood: response.data.bairro || "",
            city: response.data.localidade || "",
            state: response.data.uf || "",
          }));
        } else {
          alert("CEP não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        alert("Erro ao buscar informações do CEP!");
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const buildFullAddress = () => {
    const { street, number, neighborhood, city, state, cep, complement } =
      addressForm;
    let fullAddress = "";

    if (street) fullAddress += street;
    if (number) fullAddress += `, ${number}`;
    if (complement) fullAddress += `, ${complement}`;
    if (neighborhood) fullAddress += ` - ${neighborhood}`;
    if (city) fullAddress += `, ${city}`;
    if (state) fullAddress += ` - ${state}`;
    if (cep) fullAddress += ` - CEP: ${cep}`;

    return fullAddress;
  };

  const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/[^\d]+/g, "");
    if (cnpj.length !== 14) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += +numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== +digits.charAt(0)) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += +numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === +digits.charAt(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCNPJ(newClient.cnpj)) {
      alert("CNPJ inválido!");
      return;
    }

    // Validar campos obrigatórios do endereço
    if (
      !addressForm.cep ||
      !addressForm.street ||
      !addressForm.number ||
      !addressForm.neighborhood ||
      !addressForm.city ||
      !addressForm.state
    ) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço!");
      return;
    }

    const fullAddress = buildFullAddress();
    const clientData = { ...newClient, address: fullAddress };

    axios
      .post("https://backend-pedidos-i1qd.onrender.com/clients", clientData)
      .then(() => {
        alert("Cliente cadastrado com sucesso!");
        setShowModal(false);
        setNewClient({
          companyName: "",
          cnpj: "",
          stateInscr: "",
          email: "",
          address: "",
          phone: "",
        });
        setAddressForm({
          cep: "",
          street: "",
          number: "",
          neighborhood: "",
          city: "",
          state: "",
          complement: "",
        });
        fetchClients();
      })
      .catch((err) => {
        console.error("Erro ao cadastrar cliente:", err);
        alert("Erro ao cadastrar cliente.");
      });
  };

  return (
    <div className="clients-container">
      <Sidebar />
      <div className="clients-content">
        <div className="clients-header">
          <h1>Clientes</h1>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Novo Cliente
          </button>
        </div>

        <div className="clients-grid">
          {clients.map((client) => (
            <div key={client.id} className="client-card">
              <h3>{client.companyName}</h3>
              <p>
                <strong>CNPJ:</strong> {client.cnpj}
              </p>
              <p>
                <strong>Inscrição Estadual:</strong> {client.stateInscr}
              </p>
              <p>
                <strong>Email:</strong> {client.email}
              </p>
              <p>
                <strong>Endereço:</strong> {client.address}
              </p>
              <p>
                <strong>Telefone:</strong> {client.phone}
              </p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Novo Cliente</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                  <h3>Dados da Empresa</h3>
                  <div className="form-group">
                    <label>Nome da Empresa</label>
                    <input
                      type="text"
                      name="companyName"
                      value={newClient.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>CNPJ</label>
                      <input
                        type="text"
                        name="cnpj"
                        value={newClient.cnpj}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Inscrição Estadual</label>
                      <input
                        type="text"
                        name="stateInscr"
                        value={newClient.stateInscr}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Contato</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newClient.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={newClient.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Endereço</h3>
                  <div className="form-group">
                    <label>CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={addressForm.cep}
                      onChange={handleCEPChange}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                    />
                    {isLoadingCEP && <small>Buscando CEP...</small>}
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label>Rua/Logradouro</label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Número</label>
                      <input
                        type="text"
                        name="number"
                        value={addressForm.number}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bairro</label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={addressForm.neighborhood}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={addressForm.complement}
                        onChange={handleAddressChange}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label>Cidade</label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        maxLength={2}
                        placeholder="SP"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowModal(false)}
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

export default ClientsPage;
