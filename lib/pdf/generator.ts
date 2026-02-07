import jsPDF from 'jspdf';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatDate } from '@/lib/utils/formatters';

/**
 * Generate official-looking CNPJ certificate PDF matching Receita Federal template
 */
export async function generateCompanyPDF(company: EnhancedCompanyData): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Add Brazilian coat of arms (using emoji for now)
    doc.setFontSize(14);
    doc.text('🇧🇷', margin, y);

    // Header - REPÚBLICA FEDERATIVA DO BRASIL
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    y += 5;
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, y, { align: 'center' });

    y += 6;
    doc.setFontSize(10);
    doc.text('CADASTRO NACIONAL DA PESSOA JURÍDICA', pageWidth / 2, y, { align: 'center' });

    // Main border
    y += 8;
    doc.setLineWidth(0.5);
    doc.rect(margin, y, pageWidth - margin * 2, 240);

    // Title box
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL', pageWidth / 2, y, { align: 'center' });

    // Horizontal line after title
    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 1: CNPJ + MATRIZ + Data
    y += 7;
    const row1Y = y;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('NÚMERO DE INSCRIÇÃO', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCNPJ(company.cnpj), margin + 2, y);

    // MATRIZ box
    doc.rect(margin + 70, row1Y - 4, 25, 8);
    doc.setFontSize(8);
    doc.text('MATRIZ', margin + 72, row1Y);

    // Date
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('DATA DE ABERTURA', pageWidth - margin - 35, row1Y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(company.data_inicio_atividade), pageWidth - margin - 35, row1Y + 4);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 2: Nome Empresarial
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('NOME EMPRESARIAL', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.razao_social.toUpperCase(), margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 3: Nome Fantasia + Porte
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)', margin + 2, y);
    doc.text('PORTE', pageWidth - margin - 20, y);

    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nome_fantasia || '********', margin + 2, y);
    doc.text(company.porte || 'ME', pageWidth - margin - 20, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 4: CNAE Principal
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL', margin + 2, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const cnaeText = `${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`;
    doc.text(cnaeText, margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 5: CNAEs Secundários
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS', margin + 2, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    if (company.cnaes_secundarios && company.cnaes_secundarios.length > 0) {
        company.cnaes_secundarios.slice(0, 2).forEach((cnae, index) => {
            doc.text(`${cnae.codigo} - ${cnae.descricao}`, margin + 2, y);
            if (index === 0) y += 4;
        });
    } else {
        doc.text('Não há', margin + 2, y);
    }

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 6: Natureza Jurídica
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA', margin + 2, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${company.codigo_natureza_juridica} - Sociedade Empresária Limitada`, margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 7: Endereço
    y += 7;
    const addressRowY = y;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('LOGRADOURO', margin + 2, y);
    doc.text('NÚMERO', margin + 95, y);
    doc.text('COMPLEMENTO', pageWidth - margin - 45, y);

    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.logradouro.toUpperCase(), margin + 2, y);
    doc.text(company.numero, margin + 95, y);
    doc.text(company.complemento || '********', pageWidth - margin - 45, y);

    doc.line(margin + 90, addressRowY - 4, margin + 90, addressRowY + 7);
    doc.line(pageWidth - margin - 50, addressRowY - 4, pageWidth - margin - 50, addressRowY + 7);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 8: CEP + Bairro + Município + UF
    y += 7;
    const row8Y = y;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CEP', margin + 2, y);
    doc.text('BAIRRO/DISTRITO', margin + 35, y);
    doc.text('MUNICÍPIO', margin + 95, y);
    doc.text('UF', pageWidth - margin - 15, y);

    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.cep, margin + 2, y);
    doc.text(company.bairro.toUpperCase(), margin + 35, y);
    doc.text(company.municipio.toUpperCase(), margin + 95, y);
    doc.text(company.uf, pageWidth - margin - 15, y);

    doc.line(margin + 30, row8Y - 4, margin + 30, row8Y + 7);
    doc.line(margin + 90, row8Y - 4, margin + 90, row8Y + 7);
    doc.line(pageWidth - margin - 20, row8Y - 4, pageWidth - margin - 20, row8Y + 7);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 9: Email (EDITABLE)
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ENDEREÇO ELETRÔNICO', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const email = company.custom_email || '********';
    doc.text(email.toUpperCase(), margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 10: Telefone (EDITABLE)
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('TELEFONE', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const phone = company.custom_phone || company.ddd_telefone_1 || '********';
    doc.text(phone, margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 11: EFR
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ENTE FEDERATIVO RESPONSÁVEL (EFR)', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('********', margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 12: Situação Cadastral + Data
    y += 7;
    const situacaoY = y;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SITUAÇÃO CADASTRAL', margin + 2, y);
    doc.text('DATA DA SITUAÇÃO CADASTRAL', pageWidth - margin - 50, y);

    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.tipo_situacao_cadastral, margin + 2, y);
    doc.text(formatDate(company.data_situacao_cadastral), pageWidth - margin - 50, y);

    doc.line(pageWidth - margin - 55, situacaoY - 4, pageWidth - margin - 55, situacaoY + 7);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 13: Motivo Situação
    y += 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('MOTIVO DE SITUAÇÃO CADASTRAL', margin + 2, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.motivo_situacao_cadastral || '********', margin + 2, y);

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Row 14: Situação Especial + Data
    y += 7;
    const especialY = y;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SITUAÇÃO ESPECIAL', margin + 2, y);
    doc.text('DATA DA SITUAÇÃO ESPECIAL', pageWidth - margin - 50, y);

    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('********', margin + 2, y);
    doc.text('********', pageWidth - margin - 50, y);

    doc.line(pageWidth - margin - 55, especialY - 4, pageWidth - margin - 55, especialY + 7);

    // Convert to Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download company PDF
 */
export async function generateAndDownloadCompanyPDF(company: EnhancedCompanyData) {
    const pdfBlob = await generateCompanyPDF(company);
    const filename = `Comprovante_CNPJ_${company.razao_social.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    downloadPDF(pdfBlob, filename);
}
