/**
 * Official PDF Generator - Matches Receita Federal CNPJ Certificate
 */

import jsPDF from 'jspdf';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';

// Brasil coat of arms as base64 (simplified version)
const BRASIL_COAT_OF_ARMS = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9IiMwMDk3MzkiLz48Y2lyY2xlIGN4PSIyNSIgY3k9IjI1IiByPSIxNSIgZmlsbD0iI0ZGREYwMCIvPjwvc3ZnPg==`;

export async function generateOfficialPDF(company: EnhancedCompanyData) {
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // ============ HEADER ============
    // Coat of arms
    try {
        doc.addImage(BRASIL_COAT_OF_ARMS, 'PNG', 15, y, 15, 15);
    } catch (error) {
        // Coat of arms is optional, continue without it
        console.log('Could not add coat of arms:', error);
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, y + 5, { align: 'center' });

    doc.setFontSize(12);
    doc.text('CADASTRO NACIONAL DA PESSOA JURÍDICA', pageWidth / 2, y + 12, { align: 'center' });

    y += 25;

    // ============ CONTENT ============
    const leftMargin = 15;
    const rightMargin = pageWidth - 15;
    const contentWidth = rightMargin - leftMargin;

    // Helper function to add bordered field
    const addField = (label: string, value: string, yPos: number, height: number = 10, fullWidth: boolean = false) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        const fieldWidth = fullWidth ? contentWidth : contentWidth / 2 - 2;

        // Border
        doc.rect(leftMargin, yPos, fieldWidth, height);

        // Label
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label, leftMargin + 2, yPos + 3);

        // Value
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(value || '********', leftMargin + 2, yPos + height - 2);
    };

    const addTwoFields = (label1: string, value1: string, label2: string, value2: string, yPos: number, height: number = 10) => {
        const halfWidth = contentWidth / 2;

        // Left field
        doc.rect(leftMargin, yPos, halfWidth - 1, height);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(label1, leftMargin + 2, yPos + 3);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(value1 || '********', leftMargin + 2, yPos + height - 2);

        // Right field
        doc.rect(leftMargin + halfWidth + 1, yPos, halfWidth - 1, height);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(label2, leftMargin + halfWidth + 3, yPos + 3);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(value2 || '********', leftMargin + halfWidth + 3, yPos + height - 2);
    };

    // Row 1: CNPJ and Date
    addTwoFields(
        'NÚMERO DE INSCRIÇÃO',
        formatCNPJ(company.cnpj),
        'COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL',
        new Date().toLocaleDateString('pt-BR'),
        y,
        10
    );
    y += 10;

    // Row 2: Company Name
    addField('NOME EMPRESARIAL', company.razao_social, y, 10, true);
    y += 10;

    // Row 3: Trade Name
    addField('TÍTULO DO ESTABELECIMENTO (NOME FANTASIA)', company.nome_fantasia || '********', y, 10, true);
    y += 10;

    // Row 4: CNAE
    const cnaeText = company.cnae_principal && company.descricao_cnae
        ? `${company.cnae_principal} - ${company.descricao_cnae}`
        : company.cnae_fiscal
            ? `${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`
            : '********';

    addField('CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL', cnaeText, y, 15, true);
    y += 15;

    // Row 5: Legal Nature (simplified)
    addField('CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA', '206-2 - Sociedade Empresária Limitada', y, 10, true);
    y += 10;

    // Row 6: Address and Number
    const endereco = company.logradouro && company.logradouro !== 'undefined'
        ? `${company.descricao_tipo_de_logradouro || ''} ${company.logradouro}`.trim()
        : '********';
    const numero = company.numero || '********';

    addTwoFields('LOGRADOURO', endereco, 'NÚMERO', numero, y, 10);
    y += 10;

    // Row 7: District and City
    const bairro = company.bairro && company.bairro !== 'undefined' ? company.bairro : 'CENTRO';
    const cidade = `${company.municipio || '********'}`;

    addTwoFields('BAIRRO/DISTRITO', bairro, 'MUNICÍPIO', cidade, y, 10);
    y += 10;

    // Row 8: UF and CEP
    addTwoFields('UF', company.uf || '**', 'CEP', company.cep || '********', y, 10);
    y += 10;

    // Row 9: Contact
    const telefone = company.telefone || company.ddd_telefone_1 || company.custom_phone || '********';
    const email = company.email || company.custom_email || '********';

    addTwoFields('TELEFONE', telefone, 'ENDEREÇO ELETRÔNICO', email, y, 10);
    y += 10;

    // Row 10: Status
    const situacao = company.tipo_situacao_cadastral || 'ATIVA';
    const dataSituacao = company.data_situacao_cadastral
        ? new Date(company.data_situacao_cadastral).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');

    addTwoFields('SITUAÇÃO CADASTRAL', situacao, 'DATA DA SITUAÇÃO CADASTRAL', dataSituacao, y, 10);
    y += 10;

    // Row 11: Reason
    addField('MOTIVO DE SITUAÇÃO CADASTRAL', '********', y, 10, true);
    y += 10;

    // Row 12: Special situation
    addTwoFields('SITUAÇÃO ESPECIAL', '********', 'DATA DA SITUAÇÃO ESPECIAL', '********', y, 10);
    y += 10;

    // Footer note
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Aprovado pela Instrução Normativa RFB nº 1.634, de 06 de maio de 2016.', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7);
    doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });

    // Download
    doc.save(`CNPJ_${company.cnpj}_Comprovante.pdf`);
}
