import jsPDF from 'jspdf';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';

<<<<<<< HEAD
// Função auxiliar para carregar PNG e converter para base64
=======
// Função auxiliar para carregar imagem e converter para base64
>>>>>>> 90b160a2a2968980ce7e7e8989f1941ca4a9833f
async function loadImageAsBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
<<<<<<< HEAD
        console.error('Erro ao carregar brasão:', error);
=======
        console.error('Erro ao carregar imagem:', error);
>>>>>>> 90b160a2a2968980ce7e7e8989f1941ca4a9833f
        return '';
    }
}

export async function generateOfficialPDF(company: EnhancedCompanyData): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 15;

    // ============ BRASÃO DA REPÚBLICA (carregado dinamicamente) ============
    try {
<<<<<<< HEAD
        const logoBase64 = await loadImageAsBase64('/brasil-coat-of-arms.png');

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 15, y, 25, 25);
        } else {
            console.warn('⚠️  Brasão não carregado - continuando sem logo');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar brasão:', error);
=======
        // Carregar imagem do public folder e converter para base64
        const logoBase64 = await loadImageAsBase64('/brasil-coat-of-arms.png');

        if (logoBase64) {
            // Adicionar ao PDF
            doc.addImage(logoBase64, 'PNG', 15, y, 25, 25);
        } else {
            console.warn('Logo não carregada - continuando sem brasão');
        }
    } catch (error) {
        console.error('Erro ao adicionar logo ao PDF:', error);
>>>>>>> 90b160a2a2968980ce7e7e8989f1941ca4a9833f
    }

    // ============ HEADER - CENTERED ============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, y + 8, { align: 'center' });

    doc.setFontSize(12);
    doc.text('CADASTRO NACIONAL DA PESSOA JURÍDICA', pageWidth / 2, y + 15, { align: 'center' });
        doc.setLineWidth(0.2);
        doc.rect(leftMargin, yPos, width, height);

        // Label (small, uppercase)
        doc.setFontSize(labelFontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(label.toUpperCase(), leftMargin + 1.5, yPos + 3.5);

        // Value (bigger, bold)
        doc.setFontSize(options.fontSize || valueFontSize);
        doc.setFont('helvetica', options.bold !== false ? 'bold' : 'normal');
        doc.setTextColor(0, 0, 0);

        const valueY = yPos + (height * 0.7);
        const maxWidth = width - 3;

        // Handle long text
        const lines = doc.splitTextToSize(value || '********', maxWidth);
        if (lines.length > 1 && height < 15) {
            doc.setFontSize(7);
        }
        doc.text(lines[0], leftMargin + 1.5, valueY);
    };

    // Helper: Two fields side by side
    const addTwoFields = (
        label1: string, value1: string, width1: number,
        label2: string, value2: string, width2: number,
        yPos: number, height: number = 10
    ) => {
        addField(label1, value1, yPos, width1, height);
        addField(label2, value2, yPos, width1 + width2, height);
    };

    // ============ ROW 1: CNPJ + COMPROVANTE ============
    const col1Width = contentWidth * 0.35;
    const col2Width = contentWidth * 0.65;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // CNPJ box
    doc.rect(leftMargin, y, col1Width, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('NÚMERO DE INSCRIÇÃO', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(formatCNPJ(company.cnpj), leftMargin + 1.5, y + 8);

    // Comprovante box
    const xOffset = leftMargin + col1Width;
    doc.rect(xOffset, y, col2Width, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL', xOffset + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(new Date().toLocaleDateString('pt-BR'), xOffset + 1.5, y + 8);

    y += 10;

    // ============ ROW 2: NOME EMPRESARIAL ============
    addField('NOME EMPRESARIAL', company.razao_social, y, contentWidth, 10);
    y += 10;

    // ============ ROW 3: NOME FANTASIA ============
    const nomeFantasia = company.nome_fantasia || '********';
    addField('TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)', nomeFantasia, y, contentWidth * 0.75, 10);

    // PORTE
    const porteWidth = contentWidth * 0.25;
    addField('PORTE', company.porte || 'ME', y, porteWidth, 10);
    y += 10;

    // ============ ROW 4: CNAE ============
    const cnaeText = company.cnae_principal && company.descricao_cnae
        ? `${company.cnae_principal} - ${company.descricao_cnae}`
        : company.cnae_fiscal && company.cnae_fiscal_descricao
            ? `${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`
            : '********';

    addField('CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL', cnaeText, y, contentWidth, 16, { fontSize: 8 });
    y += 16;

    // ============ ROW 5: NATUREZA JURÍDICA ============
    const naturezaJuridica = company.codigo_natureza_juridica
        ? `${company.codigo_natureza_juridica} - Sociedade Empresária Limitada`
        : '206-2 - Sociedade Empresária Limitada';

    addField('CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA', naturezaJuridica, y, contentWidth, 10);
    y += 10;

    // ============ ROW 6: LOGRADOURO + NÚMERO ============
    const endereco = company.logradouro && company.logradouro !== 'undefined'
        ? `${company.descricao_tipo_de_logradouro || ''} ${company.logradouro}`.trim()
        : '********';
    const numero = company.numero || '********';

    const logradouroWidth = contentWidth * 0.75;
    const numeroWidth = contentWidth * 0.25;

    doc.rect(leftMargin, y, logradouroWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('LOGRADOURO', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(endereco, leftMargin + 1.5, y + 8);

    const xNum = leftMargin + logradouroWidth;
    doc.rect(xNum, y, numeroWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('NÚMERO', xNum + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(numero, xNum + 1.5, y + 8);
    y += 10;

    // ============ ROW 7: CEP + BAIRRO/DISTRITO ============
    const cep = company.cep || '********';
    const bairro = company.bairro && company.bairro !== 'undefined' ? company.bairro : 'CENTRO';

    const cepWidth = contentWidth * 0.25;
    const bairroWidth = contentWidth * 0.75;

    doc.rect(leftMargin, y, cepWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('CEP', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(cep, leftMargin + 1.5, y + 8);

    const xBairro = leftMargin + cepWidth;
    doc.rect(xBairro, y, bairroWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('BAIRRO/DISTRITO', xBairro + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(bairro, xBairro + 1.5, y + 8);
    y += 10;

    // ============ ROW 8: MUNICÍPIO + UF ============
    const municipio = company.municipio || '********';
    const uf = company.uf || '**';

    const municipioWidth = contentWidth * 0.85;
    const ufWidth = contentWidth * 0.15;

    doc.rect(leftMargin, y, municipioWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('MUNICÍPIO', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(municipio, leftMargin + 1.5, y + 8);

    const xUF = leftMargin + municipioWidth;
    doc.rect(xUF, y, ufWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('UF', xUF + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(uf, xUF + 1.5, y + 8);
    y += 10;

    // ============ ROW 9: EMAIL + TELEFONE ============
    const email = company.email || company.custom_email || '********';
    const telefone = company.telefone || company.ddd_telefone_1 || company.custom_phone || '********';

    const emailWidth = contentWidth * 0.6;
    const telWidth = contentWidth * 0.4;

    doc.rect(leftMargin, y, emailWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('ENDEREÇO ELETRÔNICO', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(email.toLowerCase(), leftMargin + 1.5, y + 8);

    const xTel = leftMargin + emailWidth;
    doc.rect(xTel, y, telWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('TELEFONE', xTel + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(telefone, xTel + 1.5, y + 8);
    y += 10;

    // ============ ROW 10: SITUAÇÃO CADASTRAL + DATA ============
    const situacao = company.tipo_situacao_cadastral || 'ATIVA';
    const dataSituacao = company.data_situacao_cadastral
        ? new Date(company.data_situacao_cadastral).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');

    const sitWidth = contentWidth * 0.6;
    const dataWidth = contentWidth * 0.4;

    doc.rect(leftMargin, y, sitWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('SITUAÇÃO CADASTRAL', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(situacao, leftMargin + 1.5, y + 8);

    const xData = leftMargin + sitWidth;
    doc.rect(xData, y, dataWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('DATA DA SITUAÇÃO CADASTRAL', xData + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(dataSituacao, xData + 1.5, y + 8);
    y += 10;

    // ============ ROW 11: MOTIVO ============
    addField('MOTIVO DE SITUAÇÃO CADASTRAL', '********', y, contentWidth, 10);
    y += 10;

    // ============ ROW 12: SITUAÇÃO ESPECIAL + DATA ============
    const sitEspWidth = contentWidth * 0.7;
    const dataEspWidth = contentWidth * 0.3;

    doc.rect(leftMargin, y, sitEspWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('SITUAÇÃO ESPECIAL', leftMargin + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('********', leftMargin + 1.5, y + 8);

    const xDataEsp = leftMargin + sitEspWidth;
    doc.rect(xDataEsp, y, dataEspWidth, 10);
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('DATA DA SITUAÇÃO ESPECIAL', xDataEsp + 1.5, y + 3.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('********', xDataEsp + 1.5, y + 8);
    y += 12;

    // ============ FOOTER ============
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60, 60, 60);
    doc.text('Aprovado pela Instrução Normativa RFB nº 1.863, de 27 de dezembro de 2018.', pageWidth / 2, y, { align: 'center' });

    y += 4;
    doc.setFontSize(6.5);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} via VerifyAds`, pageWidth / 2, y, { align: 'center' });

    return doc.output('blob');
}
