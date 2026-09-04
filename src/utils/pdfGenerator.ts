import { applyCascadeDiscount } from "./discount";

export interface Product {
  id: number;
  name: string;
  code: string;
  type?: string;
  observation?: string;
  // Preço de referência opcional, cadastrado na fábrica. O preço real usado
  // no pedido fica em CartItem.unitPrice, definido no momento da venda.
  unitPrice: number | null;
  factoryId: number;
}

export interface Factory {
  id: number;
  name: string;
  logo: string;
  email: string;
  phone: string;
  products?: Product[];
}

export interface Client {
  id: number;
  companyName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cnpj?: string;
  stateInscr?: string;
  email?: string;
  phone?: string;
}

// Nota: a observação do cliente é específica de cada pedido (não do cadastro
// do cliente), por isso é passada separadamente em generateOrderPDF, e não
// como parte da interface Client.

export interface Seller {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  representation?: string;
}

export interface CartItem {
  product: Product;
  type?: string;
  observation?: string;
  discount?: string;
  quantity: number;
  // Valor unitário definido no momento do pedido (o preço do produto é só uma referência).
  unitPrice: number;
}

export const generateOrderPDF = (orderData: {
  orderNumber: string;
  date: string;
  client: Client;
  seller: Seller;
  factory: Factory;
  cart: CartItem[];
  buyerName: string;
  buyerPhone?: string;
  sellerName?: string;
  clientObservation?: string;
  paymentMethod: string;
  paymentTerms?: string;
  freightType?: string;
  description: string;
  total: number;
}) => {
  const {
    orderNumber,
    date,
    client,
    seller,
    factory,
    cart,
    buyerName,
    buyerPhone,
    sellerName,
    clientObservation,
    paymentMethod,
    paymentTerms,
    freightType,
    description,
    total,
  } = orderData;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const pdfHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Pedido ${orderNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 10px;
                line-height: 1.3;
                color: #333;
                background: white;
                padding: 10px;
                max-width: 210mm;
                margin: 0 auto;
            }
            
            /* Header com 2 colunas (Representação e Fabricante) */
            .header-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 2px solid #000;
            }
            
            .header-column {
                padding: 10px;
            }
            
            .header-column h3 {
                font-size: 12px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                text-transform: uppercase;
                border-bottom: 1px solid #ccc;
                padding-bottom: 3px;
            }
            
            .header-info {
                font-size: 10px;
                line-height: 1.3;
            }
            
            .header-info div {
                margin-bottom: 2px;
            }
            
            /* Título principal + número/data do pedido, lado a lado */
            .main-title-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin: 10px 0;
                padding: 8px 14px;
                background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
                border: 2px solid #000;
            }

            .main-title {
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .main-title .order-number {
                font-size: 13px;
                font-weight: bold;
                letter-spacing: 0;
                margin-left: 8px;
            }

            .main-title-date {
                font-size: 11px;
                font-weight: bold;
                color: #444;
                white-space: nowrap;
            }
            
            /* Seção do cliente */
            .client-section {
                margin-bottom: 10px;
                border: 1px solid #000;
                padding: 10px;
                background: #fafafa;
            }
            
            .client-title {
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
                color: #000;
            }
            
            .client-info {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 10px;
                font-size: 9px;
                line-height: 1.3;
            }
            
            .client-main-info h4 {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #000;
            }
            
            .info-line {
                margin-bottom: 4px;
                display: flex;
                align-items: flex-start;
            }
            
            .info-label {
                font-weight: bold;
                min-width: 80px;
                margin-right: 8px;
                color: #555;
            }
            
            .info-value {
                flex: 1;
                color: #000;
            }
            
            /* Seção de produtos */
            .products-section {
                margin-bottom: 20px;
            }
            
            .products-title {
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 2px solid #000;
                text-align: center;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                margin-bottom: 15px;
            }
            
            .products-table th {
                background: #f0f0f0;
                color: #000;
                font-weight: bold;
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #000;
                font-size: 10px;
                text-transform: uppercase;
            }
            
            .products-table td {
                padding: 4px;
                border: 1px solid #ccc;
                text-align: center;
                background: white;
            }
            
            .products-table tr:nth-child(even) td {
                background: #f9f9f9;
            }
            
            .products-table tr:hover td {
                background: #f0f8ff;
            }
            
            .product-name {
                text-align: left !important;
                font-weight: bold;
                color: #000;
            }
            
            .text-right {
                text-align: right !important;
            }
            
            .text-center {
                text-align: center !important;
            }
            
            /* Seção inferior com descrição e totais */
            .bottom-section {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 30px;
                margin-top: 20px;
            }
            
            .description-section {
                border: 1px solid #ccc;
                padding: 10px;
                background: #fafafa;
                min-height: 80px;
            }
            
            .description-title {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 10px;
                color: #000;
                text-transform: uppercase;
            }
            
            .description-content {
                font-size: 10px;
                line-height: 1.4;
                color: #333;
            }
            
            .totals-section {
                border: 1px solid #000;
                background: white;
            }
            
            .totals-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .totals-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #ccc;
                font-size: 11px;
            }
            
            .totals-table .label {
                font-weight: bold;
                background: #f0f0f0;
                text-transform: uppercase;
                color: #333;
                border-right: 1px solid #ccc;
            }
            
            .totals-table .value {
                text-align: right;
                font-weight: bold;
                color: #000;
                background: white;
            }
            
            .totals-table tr:last-child td {
                background: #f0f0f0;
                color: #000;
                font-weight: bold;
                font-size: 12px;
                border-bottom: none;
            }
            
            /* Responsividade para impressão */
            @media print {
                @page { margin: 5mm; }
                body { 
                    margin: 0; 
                    padding: 0;
                    font-size: 9px;
                }
                
                .header-section {
                    gap: 10px;
                }
                
                .client-info {
                    gap: 10px;
                }
                
                .bottom-section {
                    gap: 15px;
                }
            }
            
            /* Melhorias visuais */
            .company-name {
                font-size: 11px !important;
                font-weight: bold;
                color: #000;
            }
            
            .contact-info {
                color: #666;
                font-size: 9px;
            }
            
            .highlight {
                background: #ffffcc;
                padding: 2px 4px;
                border-radius: 2px;
            }
        </style>
    </head>
    <body>
        <!-- Header com 2 colunas -->
        <div class="header-section">
            <!-- Dados da Representação -->
            <div class="header-column">
                <h3>Representação</h3>
                <div class="header-info">
                    <div class="company-name">${seller.representation || seller.name || ""}</div>
                    ${seller.representation ? `<div class="contact-info">Vendedor: ${sellerName || seller.name || ""}</div>` : ""}
                    <div class="contact-info">${seller.email || ""}</div>
                    <div class="contact-info">${seller.phone || ""}</div>
                </div>
            </div>
            
            <!-- Dados da Fábrica -->
            <div class="header-column">
                <h3>Fábricante</h3>
                <div class="header-info">
                    <div class="company-name">${factory.name}</div>
                    <div class="contact-info">${factory.email || ""}</div>
                    <div class="contact-info">${factory.phone || ""}</div>
                </div>
            </div>
        </div>
        
        <!-- Título Principal + Número do Pedido -->
        <div class="main-title-bar">
            <div class="main-title">PEDIDO DE VENDA <span class="order-number">N° ${orderNumber}</span></div>
            <div class="main-title-date">DATA: ${date}</div>
        </div>
        
        <!-- Seção do Cliente -->
        <div class="client-section">
            <div class="client-title">CLIENTE</div>
            <div class="client-info">
                <!-- Informações principais do cliente -->
                <div class="client-main-info">
                    <h4>${client.companyName || ""}</h4>
                    <div class="info-line">
                        <span class="info-label">ENDEREÇO:</span>
                        <span class="info-value">${client.address || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">CNPJ:</span>
                        <span class="info-value">${client.cnpj || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">INSC.ESTADUAL:</span>
                        <span class="info-value">${
                          client.stateInscr || ""
                        }</span>
                    </div>
                </div>
                
                <!-- Dados de contato -->
                <div class="client-contact">
                    <div class="info-line">
                        <span class="info-label">TEL.CLIENTE:</span>
                        <span class="info-value">${client.phone || ""}</span>
                    </div>
                    <div class="info-line">
                        <span class="info-label">E-MAIL:</span>
                        <span class="info-value">${client.email || ""}</span>
                    </div>
                </div>
                
                <!-- Dados comerciais -->
                <div class="client-commercial">
                    <div class="info-line">
                        <span class="info-label">FORMA PGTO:</span>
                        <span class="info-value">${paymentMethod}${paymentTerms ? ` — Prazo: ${paymentTerms} dias` : ""}</span>
                    </div>
                </div>
            </div>
            ${clientObservation ? `
            <div class="info-line" style="margin-top: 8px; border-top: 1px solid #ccc; padding-top: 8px;">
                <span class="info-label">OBS. CLIENTE:</span>
                <span class="info-value">${clientObservation}</span>
            </div>
            ` : ''}
        </div>

        <!-- Seção do Comprador -->
        ${buyerName || buyerPhone ? `
        <div class="client-section" style="margin-top: -10px;">
            <div class="client-title">COMPRADOR</div>
            <div class="client-info" style="grid-template-columns: 1fr 1fr;">
                <div class="info-line">
                    <span class="info-label">NOME:</span>
                    <span class="info-value">${buyerName || "—"}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">TELEFONE:</span>
                    <span class="info-value">${buyerPhone || "—"}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Seção de Produtos -->
        <div class="products-section">
            <div class="products-title">PRODUTOS</div>
            <table class="products-table">
                <thead>
                    <tr>
                        <th style="width: 14%;">CÓDIGO</th>
                        <th style="width: 26%;">PRODUTO</th>
                        <th style="width: 6%;">QTD</th>
                        <th style="width: 11%;">VALOR</th>
                        <th style="width: 15%;">DESC %</th>
                        <th style="width: 13%;">SUBTOTAL</th>
                        <th style="width: 15%;">VALOR FINAL</th>
                    </tr>
                </thead>

                <tbody>
                    ${cart
                      .map(
                        (item) => {
                          const subtotal = applyCascadeDiscount(item.unitPrice, item.discount);
                          const valorFinal = subtotal * item.quantity;
                          return `
                        <tr>
                            <td class="text-center" style="font-weight: bold;">${item.product.code}</td>
                            <td class="product-name">
                                <strong>${item.product.name}</strong>
                                ${item.type ? `, <small>Tipo: ${item.type}</small>` : ""}
                                ${item.observation ? `<br><small style="color:#555;">Obs: ${item.observation}</small>` : ""}
                            </td>
                            <td class="text-center"><strong>${
                              item.quantity
                            }</strong></td>
                            <td class="text-right">R$ ${item.unitPrice.toFixed(
                              2
                            )}</td>
                            <td class="text-center">${item.discount || "0"}</td>
                            <td class="text-right">R$ ${subtotal.toFixed(
                              2
                            )}</td>
                            <td class="text-right"><strong>R$ ${valorFinal.toFixed(2)}</strong></td>
                        </tr>
                    `;
                        }
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <!-- Seção Inferior: Descrição e Totais -->
        <div class="bottom-section">
            <!-- Descrição e Condições -->
            <div class="description-section">
                
                ${freightType ? `
                <div class="description-title">Tipo de Frete</div>
                <div class="description-content" style="margin-bottom: 15px;">
                    <strong>${freightType}</strong> - ${freightType === 'CIF' ? 'Cost, Insurance and Freight (Fornecedor responsável)' : 'Free On Board (Comprador responsável)'}
                </div>
                ` : ''}

                <div class="description-title">Observações</div>
                <div class="description-content">
                    ${description || "Nenhuma observação adicional."}
                </div>
            </div>
            
            <!-- Totais -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Total dos Produtos</td>
                        <td class="value">R$ ${total.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Geral</td>
                        <td class="value">R$ ${total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            });
        </script>
    </body>
    </html>
  `;

  printWindow.document.write(pdfHTML);
  printWindow.document.close();
};
