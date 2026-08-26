import { toast } from "react-toastify";

/**
 * Extrai uma mensagem de erro amigável de uma resposta do axios/API.
 * Cobre os formatos usados pelo backend ({ message }) e casos de erro de rede.
 */
export const getErrorMessage = (error: any, fallback = "Algo deu errado. Tente novamente."): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message === "Network Error") {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  if (error?.code === "ECONNABORTED") {
    return "A requisição demorou demais para responder. Tente novamente.";
  }
  return fallback;
};

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
  /** Extrai a mensagem de erro da resposta da API e exibe como toast de erro. */
  apiError: (error: any, fallback?: string) => toast.error(getErrorMessage(error, fallback)),
};
