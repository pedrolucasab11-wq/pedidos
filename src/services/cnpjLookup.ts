import axios from "axios";

// BrasilAPI - serviço público e gratuito de consulta de CNPJ (dados da Receita Federal)
// https://brasilapi.com.br/docs#tag/CNPJ
const BRASIL_API_BASE_URL = "https://brasilapi.com.br/api/cnpj/v1";

export interface CNPJLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  endereco: string;
  // Campos de endereço separados, úteis para formulários com rua/número/complemento distintos
  logradouro: string;
  numero: string;
  complemento: string;
  dataAbertura: string; // yyyy-MM-dd, pronto para <input type="date">
  porte: string;
  atividadePrincipal: string;
  atividadeSecundaria: string;
  naturezaJuridica: string;
}

interface BrasilAPICNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cep: string;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  descricao_tipo_de_logradouro: string;
  data_inicio_atividade: string;
  descricao_porte?: string;
  porte?: string;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: { codigo: number; descricao: string }[];
  natureza_juridica: string;
}

const buildEndereco = (data: BrasilAPICNPJResponse) => {
  const parts: string[] = [];
  if (data.descricao_tipo_de_logradouro && data.logradouro) {
    parts.push(`${data.descricao_tipo_de_logradouro} ${data.logradouro}`);
  } else if (data.logradouro) {
    parts.push(data.logradouro);
  }
  if (data.numero) parts.push(data.numero);
  const endereco = parts.join(", ");
  return data.complemento ? `${endereco} - ${data.complemento}` : endereco;
};

/**
 * Consulta os dados públicos de um CNPJ na BrasilAPI (fonte: Receita Federal).
 * Lança erro se o CNPJ não for encontrado ou a consulta falhar.
 */
export const lookupCNPJ = async (cnpj: string): Promise<CNPJLookupResult> => {
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  const { data } = await axios.get<BrasilAPICNPJResponse>(
    `${BRASIL_API_BASE_URL}/${cleanCNPJ}`
  );

  const logradouro =
    data.descricao_tipo_de_logradouro && data.logradouro
      ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`
      : data.logradouro || "";

  return {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social || "",
    nomeFantasia: data.nome_fantasia || data.razao_social || "",
    cep: data.cep || "",
    estado: data.uf || "",
    cidade: data.municipio || "",
    bairro: data.bairro || "",
    endereco: buildEndereco(data),
    logradouro,
    numero: data.numero || "",
    complemento: data.complemento || "",
    dataAbertura: data.data_inicio_atividade || "",
    porte: data.descricao_porte || data.porte || "",
    atividadePrincipal: data.cnae_fiscal_descricao || "",
    atividadeSecundaria: (data.cnaes_secundarios || [])
      .map((a) => a.descricao)
      .join("; "),
    naturezaJuridica: data.natureza_juridica || "",
  };
};
