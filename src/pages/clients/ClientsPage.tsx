import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ToggleSwitch from "../../components/ToggleSwitch";
import { maskCNPJ, maskPhone, maskStateInscr, maskCEP, validateCNPJ } from "../../utils/masks";
import { lookupCNPJ } from "../../services/cnpjLookup";
import { notify } from "../../utils/notify";
import {
  FaUsers,
  FaPlus,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";
import "./Clients.css";

interface Client {
  id: number;
  companyName: string;
  cnpj: string;
  stateInscr: string;
  email: string;
  address: string;
  phone: string;
  active: boolean;
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
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [cnpjAutoFilled, setCnpjAutoFilled] = useState(false);

  const fetchClients = () => {
    api
      .get("/clients")
      .then((res) => setClients(res.data))
      .catch((err) => {
        console.error("Erro ao buscar clientes:", err);
        notify.apiError(err, "Não foi possível carregar a lista de clientes.");
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleToggleActive = (client: Client, nextActive: boolean) => {
    // Atualização otimista para resposta visual imediata
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, active: nextActive } : c))
    );

    api
      .patch(`/clients/${client.id}/status`, { active: nextActive })
      .catch((err) => {
        console.error("Erro ao atualizar status do cliente:", err);
        notify.apiError(err, "Não foi possível atualizar o status do cliente. Tente novamente.");
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, active: client.active } : c))
        );
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone") value = maskPhone(value);
    if (name === "stateInscr") value = maskStateInscr(value);

    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCNPJ = e.target.value.replace(/\D/g, "");
    const formattedCNPJ = maskCNPJ(e.target.value);

    setNewClient((prev) => ({ ...prev, cnpj: formattedCNPJ }));
    setCnpjAutoFilled(false);

    if (rawCNPJ.length === 14) {
      if (!validateCNPJ(rawCNPJ)) {
        notify.warning("CNPJ inválido! Verifique os números digitados.");
        return;
      }

      setIsLoadingCNPJ(true);
      try {
        const data = await lookupCNPJ(rawCNPJ);

        setNewClient((prev) => ({
          ...prev,
          companyName: data.nomeFantasia || prev.companyName,
        }));

        setAddressForm((prev) => ({
          ...prev,
          cep: data.cep ? maskCEP(data.cep) : prev.cep,
          street: data.logradouro || prev.street,
          number: data.numero || prev.number,
          complement: data.complemento || prev.complement,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.cidade || prev.city,
          state: data.estado || prev.state,
        }));

        setCnpjAutoFilled(true);
      } catch (error) {
        console.error("Erro ao consultar CNPJ:", error);
        notify.warning(
          "Não foi possível localizar este CNPJ na base da Receita Federal. Preencha os dados manualmente."
        );
      } finally {
        setIsLoadingCNPJ(false);
      }
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCEP = e.target.value.replace(/\D/g, "");
    const formattedCEP = maskCEP(e.target.value);

    setAddressForm((prev) => ({ ...prev, cep: formattedCEP }));

    if (rawCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const response = await axios.get<ViaCEPResponse>(
          `https://viacep.com.br/ws/${rawCEP}/json/`
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
          notify.warning("CEP não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        notify.warning("Erro ao buscar informações do CEP!");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCNPJ(newClient.cnpj)) {
      notify.warning("CNPJ inválido!");
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
      notify.warning("Por favor, preencha todos os campos obrigatórios do endereço!");
      return;
    }

    const fullAddress = buildFullAddress();
    const clientData = { ...newClient, address: fullAddress };

    api
      .post("/clients", clientData)
      .then(() => {
        notify.success("Cliente cadastrado com sucesso!");
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
        notify.apiError(err, "Erro ao cadastrar cliente.");
      });
  };

  return (
    <div className="clients-container">
      <Sidebar />
      <div className="clients-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1><FaUsers className="page-title-icon" /> Clientes</h1>
            <p>{clients.length} cliente(s) cadastrado(s)</p>
          </div>
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            <FaPlus /> Novo Cliente
          </button>
        </div>

        {/* Grid de clientes */}
        {clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaUsers /></div>
            <h3>Nenhum cliente cadastrado</h3>
            <p>Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="clients-grid">
            {clients.map((client) => (
              <div key={client.id} className={`client-card ${!client.active ? "client-card-inactive" : ""}`}>
                <div className="client-card-name-row">
                  <span className="client-card-name">
                    <FaBuilding className="card-icon" /> {client.companyName}
                  </span>
                  <ToggleSwitch
                    checked={client.active}
                    onChange={(next) => handleToggleActive(client, next)}
                    id={`client-toggle-${client.id}`}
                  />
                </div>
                <div className="client-card-info">
                  <div className="client-info-row">
                    <strong>CNPJ</strong> {client.cnpj}
                  </div>
                  <div className="client-info-row">
                    <strong>IE</strong> {client.stateInscr || '—'}
                  </div>
                  <div className="client-info-row">
                    <FaEnvelope className="row-icon" /> {client.email}
                  </div>
                  <div className="client-info-row">
                    <FaPhone className="row-icon" /> {client.phone}
                  </div>
                  <div className="client-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span><FaMapMarkerAlt className="row-icon" /> {client.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Novo Cliente */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <h2><FaUsers className="modal-title-icon" /> Novo Cliente</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">

                  {/* Dados da Empresa */}
                  <div className="section-divider"><FaBuilding /> Dados da Empresa</div>
                  <div className="form-group">
                    <label htmlFor="c-name">Nome da Empresa *</label>
                    <input id="c-name" type="text" name="companyName" value={newClient.companyName}
                      onChange={handleChange} placeholder="Ex: Lojas Silva Ltda." required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="c-cnpj">CNPJ *</label>
                      <input id="c-cnpj" type="text" name="cnpj" value={newClient.cnpj}
                        onChange={handleCNPJChange} placeholder="00.000.000/0000-00" maxLength={18} required />
                      {isLoadingCNPJ && (
                        <small className="cep-loading"><FaSpinner className="spin-icon" /> Consultando CNPJ na Receita Federal...</small>
                      )}
                      {cnpjAutoFilled && !isLoadingCNPJ && (
                        <small className="cep-loading" style={{ color: "var(--color-success)" }}>
                          <FaCheckCircle /> Dados preenchidos automaticamente. Revise antes de salvar.
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-ie">Inscrição Estadual</label>
                      <input id="c-ie" type="text" name="stateInscr" value={newClient.stateInscr}
                        onChange={handleChange} placeholder="000.000.000.000" />
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="section-divider"><FaPhone /> Contato</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="c-email">E-mail *</label>
                      <input id="c-email" type="email" name="email" value={newClient.email}
                        onChange={handleChange} placeholder="contato@empresa.com" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-phone">Telefone *</label>
                      <input id="c-phone" type="tel" name="phone" value={newClient.phone}
                        onChange={handleChange} placeholder="(11) 99999-9999" required />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="section-divider"><FaMapMarkerAlt /> Endereço</div>
                  <div className="form-group">
                    <label htmlFor="c-cep">CEP *</label>
                    <input id="c-cep" type="text" name="cep" value={addressForm.cep}
                      onChange={handleCEPChange} placeholder="00000-000" maxLength={9} required />
                    {isLoadingCEP && <small className="cep-loading"><FaSpinner className="spin-icon" /> Buscando CEP...</small>}
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="c-street">Rua / Logradouro *</label>
                      <input id="c-street" type="text" name="street" value={addressForm.street}
                        onChange={handleAddressChange} placeholder="Nome da rua" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-number">Número *</label>
                      <input id="c-number" type="text" name="number" value={addressForm.number}
                        onChange={handleAddressChange} placeholder="123" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="c-neighborhood">Bairro *</label>
                      <input id="c-neighborhood" type="text" name="neighborhood" value={addressForm.neighborhood}
                        onChange={handleAddressChange} placeholder="Nome do bairro" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-complement">Complemento</label>
                      <input id="c-complement" type="text" name="complement" value={addressForm.complement}
                        onChange={handleAddressChange} placeholder="Apto, Sala..." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="c-city">Cidade *</label>
                      <input id="c-city" type="text" name="city" value={addressForm.city}
                        onChange={handleAddressChange} placeholder="Nome da cidade" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-state">Estado *</label>
                      <input id="c-state" type="text" name="state" value={addressForm.state}
                        onChange={handleAddressChange} placeholder="SP" maxLength={2} required />
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-success"><FaCheck /> Salvar Cliente</button>
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
