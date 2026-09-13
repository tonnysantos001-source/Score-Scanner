import jsPDF from 'jspdf';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

const JUNTAS_COMERCIAIS: Record<string, { sigla: string; nome: string; ddd: string }> = {
    AC: { sigla: 'JUCEAC', nome: 'JUNTA COMERCIAL DO ESTADO DO ACRE', ddd: '68' },
    AL: { sigla: 'JUCEAL', nome: 'JUNTA COMERCIAL DO ESTADO DE ALAGOAS', ddd: '82' },
    AP: { sigla: 'JUCAP', nome: 'JUNTA COMERCIAL DO ESTADO DO AMAPÁ', ddd: '96' },
    AM: { sigla: 'JUCEA', nome: 'JUNTA COMERCIAL DO ESTADO DO AMAZONAS', ddd: '92' },
    BA: { sigla: 'JUCEB', nome: 'JUNTA COMERCIAL DO ESTADO DA BAHIA', ddd: '71' },
    CE: { sigla: 'JUCEC', nome: 'JUNTA COMERCIAL DO ESTADO DO CEARÁ', ddd: '85' },
    DF: { sigla: 'JUCIS-DF', nome: 'JUNTA COMERCIAL DO DISTRITO FEDERAL', ddd: '61' },
    ES: { sigla: 'JUCEES', nome: 'JUNTA COMERCIAL DO ESTADO DO ESPÍRITO SANTO', ddd: '27' },
    GO: { sigla: 'JUCEG', nome: 'JUNTA COMERCIAL DO ESTADO DE GOIÁS', ddd: '62' },
    MA: { sigla: 'JUCEMA', nome: 'JUNTA COMERCIAL DO ESTADO DO MARANHÃO', ddd: '98' },
    MT: { sigla: 'JUCEMAT', nome: 'JUNTA COMERCIAL DO ESTADO DE MATO GROSSO', ddd: '65' },
    MS: { sigla: 'JUCEMS', nome: 'JUNTA COMERCIAL DO ESTADO DE MATO GROSSO DO SUL', ddd: '67' },
    MG: { sigla: 'JUCEMG', nome: 'JUNTA COMERCIAL DO ESTADO DE MINAS GERAIS', ddd: '31' },
    PA: { sigla: 'JUCEPA', nome: 'JUNTA COMERCIAL DO ESTADO DO PARÁ', ddd: '91' },
    PB: { sigla: 'JUCEP', nome: 'JUNTA COMERCIAL DO ESTADO DA PARAÍBA', ddd: '83' },
    PR: { sigla: 'JUCEPAR', nome: 'JUNTA COMERCIAL DO PARANÁ', ddd: '41' },
    PE: { sigla: 'JUCEPE', nome: 'JUNTA COMERCIAL DO ESTADO DE PERNAMBUCO', ddd: '81' },
    PI: { sigla: 'JUCEPI', nome: 'JUNTA COMERCIAL DO ESTADO DO PIAUÍ', ddd: '86' },
    RJ: { sigla: 'JUCERJA', nome: 'JUNTA COMERCIAL DO ESTADO DO RIO DE JANEIRO', ddd: '21' },
    RN: { sigla: 'JUCERN', nome: 'JUNTA COMERCIAL DO ESTADO DO RIO GRANDE DO NORTE', ddd: '84' },
    RS: { sigla: 'JUCISRS', nome: 'JUNTA COMERCIAL DO ESTADO DO RIO GRANDE DO SUL', ddd: '51' },
    RO: { sigla: 'JUCER', nome: 'JUNTA COMERCIAL DO ESTADO DE RONDÔNIA', ddd: '69' },
    RR: { sigla: 'JUCERR', nome: 'JUNTA COMERCIAL DO ESTADO DE RORAIMA', ddd: '95' },
    SC: { sigla: 'JUCESC', nome: 'JUNTA COMERCIAL DO ESTADO DE SANTA CATARINA', ddd: '48' },
    SP: { sigla: 'JUCESP', nome: 'JUNTA COMERCIAL DO ESTADO DE SÃO PAULO', ddd: '11' },
    SE: { sigla: 'JUCESE', nome: 'JUNTA COMERCIAL DO ESTADO DE SERGIPE', ddd: '79' },
    TO: { sigla: 'JUCETINS', nome: 'JUNTA COMERCIAL DO ESTADO DO TOCANTINS', ddd: '63' },
};

function generateDeterministicNIRE(cnpj: string, uf: string): string {
    const clean = cnpj.replace(/\D/g, '');
    const stateCodes: Record<string, string> = {
        SP: '35', RJ: '33', MG: '31', RS: '43', PR: '41', SC: '42', BA: '29', GO: '52', PE: '26', CE: '23',
    };
    const prefix = stateCodes[uf.toUpperCase()] || '35';
    const body = clean.slice(0, 8);
    const check = ((parseInt(clean.slice(0, 4), 10) + parseInt(clean.slice(4, 8), 10)) % 9) + 1;
    return `${prefix}2${body}${check}`;
}

function generateDeterministicProtocol(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    const year = (new Date().getFullYear() % 100).toString();
    const num = clean.slice(2, 8);
    const dig = (parseInt(clean.slice(8, 10), 10) % 9).toString();
    return `${year}/${num}-${dig}`;
}

function generateDeterministicHash(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    let hash = '';
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < 32; i++) {
        const charIdx = (parseInt(clean[i % clean.length], 10) * (i + 3) + i * 7) % chars.length;
        hash += chars[charIdx];
    }
    return hash.match(/.{1,4}/g)?.join('.') || hash;
}

export async function generateContratoSocialPDF(company: EnhancedCompanyData): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');

    const W = doc.internal.pageSize.getWidth();   // 210 mm
    const H = doc.internal.pageSize.getHeight();  // 297 mm
    const lm = 20; // left margin
    const rm = 20; // right margin
    const tm = 22; // top margin
    const bm = 22; // bottom margin
    const bodyW = W - lm - rm; // 170 mm

    const uf = (company.uf || 'SP').toUpperCase();
    const junta = JUNTAS_COMERCIAIS[uf] || JUNTAS_COMERCIAIS['SP'];
    const nire = generateDeterministicNIRE(company.cnpj, uf);
    const protocolo = generateDeterministicProtocol(company.cnpj);
    const hash = generateDeterministicHash(company.cnpj);
    const dataRegistro = formatDate(company.data_inicio_atividade || '2020-01-01');

    const isSA = company.razao_social.toUpperCase().includes(' S.A.')
        || company.razao_social.toUpperCase().includes(' S/A')
        || company.razao_social.toUpperCase().endsWith(' S.A')
        || (company.natureza_juridica && company.natureza_juridica.toLowerCase().includes('anônima'));

    const documentType = isSA ? 'ESTATUTO SOCIAL' : 'CONTRATO SOCIAL';
    const documentTitle = isSA
        ? 'ESTATUTO SOCIAL CONSOLIDADO'
        : 'INSTRUMENTO PARTICULAR DE CONSOLIDAÇÃO DO CONTRATO SOCIAL';

    let y = tm;

    // Helper: draw official header with Junta Comercial digital seal
    const drawHeader = (pageNumber: number) => {
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(248, 250, 252);
        doc.rect(lm, 10, bodyW, 16, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(junta.nome, W / 2, 14.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        const certLine = `CERTIFICO O REGISTRO SOB O Nº ${nire} EM ${dataRegistro} • PROTOCOLO: ${protocolo}`;
        doc.text(certLine, W / 2, 19, { align: 'center' });

        const authLine = `CHANCELA ELETRÔNICA ICP-BRASIL: ${hash}`;
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(authLine, W / 2, 23, { align: 'center' });

        // Lateral stamp bar on right margin (typical of commercial registry)
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(`REGISTRO DIGITAL ${junta.sigla} • PROTOCOLO ${protocolo} • DATA: ${dataRegistro} • FL: ${pageNumber}`, W - 8, H / 2, {
            angle: -90,
            align: 'center',
        });

        // Bottom footer
        doc.setDrawColor(200, 200, 200);
        doc.line(lm, H - 14, W - rm, H - 14);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${company.razao_social} • CNPJ ${formatCNPJ(company.cnpj)} • NIRE ${nire}`, lm, H - 9);
        doc.text(`Página ${pageNumber}`, W - rm, H - 9, { align: 'right' });
    };

    let currentPage = 1;
    drawHeader(currentPage);
    y = 34;

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > H - bm - 10) {
            doc.addPage();
            currentPage++;
            drawHeader(currentPage);
            y = 34;
        }
    };

    // ─── DOCUMENT TITLE ──────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(documentTitle, W / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(company.razao_social.toUpperCase(), W / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`CNPJ/MF nº ${formatCNPJ(company.cnpj)} • NIRE: ${nire}`, W / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(lm, y, W - rm, y);
    y += 7;

    // ─── PREÂMBULO (SÓCIOS) ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('PREÂMBULO', lm, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    // Extract partners from company.qsa or generate qualified representation
    const qsaList = Array.isArray(company.qsa) && company.qsa.length > 0 ? company.qsa : [];
    let partnersText = '';

    if (qsaList.length > 0) {
        partnersText = qsaList.map((socio, idx) => {
            const role = socio.qualificacao_socio || (idx === 0 ? 'Sócio-Administrador' : 'Sócio');
            const docNum = socio.cnpj_cpf_do_socio || `***.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-**`;
            return `${idx + 1}. ${socio.nome_socio.toUpperCase()}, brasileiro(a), qualificado(a) na condição de ${role}, portador(a) do documento nº ${docNum}, com domicílio comercial e residência na sede da sociedade;`;
        }).join('\n\n');
    } else {
        partnersText = `Os signatários e componentes da sociedade empresarial denominada ${company.razao_social.toUpperCase()}, devidamente qualificados e arquivados nos registros desta Junta Comercial perante a Receita Federal do Brasil, pelo presente instrumento e na melhor forma de direito, resolvem consolidar o presente ${documentType}:`;
    }

    const preambuloLines = doc.splitTextToSize(partnersText, bodyW);
    checkPageBreak(preambuloLines.length * 4);
    doc.text(preambuloLines, lm, y);
    y += preambuloLines.length * 4 + 6;

    // ─── CLÁUSULA 1ª: DENOMINAÇÃO, SEDE E DURAÇÃO ───────────────────────────────
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA PRIMEIRA – DA DENOMINAÇÃO, SEDE, FILIAIS E PRAZO DE DURAÇÃO`, lm, y);
    y += 5;

    const fullAddress = [
        company.descricao_tipo_de_logradouro,
        company.logradouro,
        company.numero ? `nº ${company.numero}` : '',
        company.complemento,
        company.bairro ? `Bairro ${company.bairro}` : '',
        `${company.municipio || 'São Paulo'} - ${uf}`,
        company.cep ? `CEP ${company.cep}` : '',
    ].filter(Boolean).join(', ');

    const clausula1Text = `A sociedade gira sob a denominação social de ${company.razao_social.toUpperCase()}${company.nome_fantasia ? ` (com o nome a título de estabelecimento ${company.nome_fantasia.toUpperCase()})` : ''}, com sede e domicílio legal situado à ${fullAddress}. O prazo de duração da sociedade é por tempo indeterminado, iniciando suas atividades em ${dataRegistro}.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula1Lines = doc.splitTextToSize(clausula1Text, bodyW);
    checkPageBreak(clausula1Lines.length * 4);
    doc.text(clausula1Lines, lm, y);
    y += clausula1Lines.length * 4 + 6;

    // ─── CLÁUSULA 2ª: DO OBJETO SOCIAL ──────────────────────────────────────────
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA SEGUNDA – DO OBJETO SOCIAL`, lm, y);
    y += 5;

    const mainActivity = company.cnae_fiscal_descricao || 'Atividades de prestação de serviços de pagamento e intermediação financeira';
    let clausula2Text = `A sociedade tem por objeto social a consecução das seguintes atividades econômicas empresariais:
a) Atividade Principal: ${mainActivity} (CNAE Fiscal: ${company.cnae_fiscal || '0000000'}).`;

    if (Array.isArray(company.cnaes_secundarios) && company.cnaes_secundarios.length > 0) {
        const validSec = company.cnaes_secundarios.filter(s => s.descricao && !s.descricao.toLowerCase().includes('não informad'));
        if (validSec.length > 0) {
            clausula2Text += '\nb) Atividades Secundárias:\n' + validSec.slice(0, 4).map(s => `  • ${s.descricao} (CNAE: ${s.codigo})`).join('\n');
        }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula2Lines = doc.splitTextToSize(clausula2Text, bodyW);
    checkPageBreak(clausula2Lines.length * 4);
    doc.text(clausula2Lines, lm, y);
    y += clausula2Lines.length * 4 + 6;

    // ─── CLÁUSULA 3ª: DO CAPITAL SOCIAL ─────────────────────────────────────────
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA TERCEIRA – DO CAPITAL SOCIAL E DISTRIBUIÇÃO DE QUOTAS`, lm, y);
    y += 5;

    const capital = company.capital_social || 100000;
    const formattedCapital = formatCurrency(capital);
    const numQuotas = Math.floor(capital);

    const clausula3Text = `O capital social da empresa, totalmente subscrito e integralizado em moeda corrente nacional, é de ${formattedCapital}, dividido em ${numQuotas.toLocaleString('pt-BR')} (número de quotas no valor nominal de R$ 1,00 cada uma), distribuídas e distribuídas entre os sócios em rigorosa conformidade com os registros contábeis e arquivamentos desta Junta Comercial:`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula3Lines = doc.splitTextToSize(clausula3Text, bodyW);
    checkPageBreak(clausula3Lines.length * 4);
    doc.text(clausula3Lines, lm, y);
    y += clausula3Lines.length * 4 + 4;

    // Table of Capital distribution
    checkPageBreak(25);
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(241, 245, 249);
    doc.rect(lm, y, bodyW, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('SÓCIO / ACIONISTA', lm + 3, y + 4.5);
    doc.text('QUOTAS', lm + 110, y + 4.5);
    doc.text('VALOR (R$)', lm + 138, y + 4.5);
    doc.text('%', lm + 163, y + 4.5);
    y += 7;

    const partners = qsaList.length > 0 ? qsaList : [{ nome_socio: company.razao_social, qualificacao_socio: 'Controlador' }];
    const percentEach = (100 / partners.length);
    const quotasEach = Math.floor(numQuotas / partners.length);

    partners.forEach((p, idx) => {
        checkPageBreak(7);
        doc.setFillColor(idx % 2 === 0 ? 255 : 248);
        doc.rect(lm, y, bodyW, 6.5, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(51, 65, 85);
        doc.text(p.nome_socio.toUpperCase().slice(0, 45), lm + 3, y + 4.5);
        doc.text(quotasEach.toLocaleString('pt-BR'), lm + 110, y + 4.5);
        doc.text(formatCurrency(quotasEach), lm + 138, y + 4.5);
        doc.text(`${percentEach.toFixed(1)}%`, lm + 163, y + 4.5);
        y += 6.5;
    });

    // Total row
    checkPageBreak(7);
    doc.setFillColor(241, 245, 249);
    doc.rect(lm, y, bodyW, 6.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL INTEGRALIZADO', lm + 3, y + 4.5);
    doc.text(numQuotas.toLocaleString('pt-BR'), lm + 110, y + 4.5);
    doc.text(formattedCapital, lm + 138, y + 4.5);
    doc.text('100,0%', lm + 163, y + 4.5);
    y += 10;

    // ─── CLÁUSULA 4ª: DA ADMINISTRAÇÃO ──────────────────────────────────────────
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA QUARTA – DA ADMINISTRAÇÃO E PODERES`, lm, y);
    y += 5;

    const clausula4Text = `A administração da sociedade e a representação ativa, passiva, judicial e extrajudicial caberá aos administradores designados no preâmbulo deste instrumento, os quais responderão isolada ou conjuntamente pelos atos praticados em nome da sociedade, sendo-lhes expressamente vedado o uso da denominação social em fianças, avais, cauções ou quaisquer obrigações alheias aos interesses sociais.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula4Lines = doc.splitTextToSize(clausula4Text, bodyW);
    checkPageBreak(clausula4Lines.length * 4);
    doc.text(clausula4Lines, lm, y);
    y += clausula4Lines.length * 4 + 6;

    // ─── CLÁUSULA 5ª: DO EXERCÍCIO SOCIAL ───────────────────────────────────────
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA QUINTA – DO EXERCÍCIO SOCIAL E DEMONSTRAÇÕES FINANCEIRAS`, lm, y);
    y += 5;

    const clausula5Text = `O exercício social coincidirá com o ano civil, encerrando-se em 31 de dezembro de cada exercício, ocasião em que os administradores prestarão contas aos sócios e elaborarão as demonstrações financeiras de acordo com as normas contábeis vigentes e as diretrizes dos órgãos reguladores competentes.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula5Lines = doc.splitTextToSize(clausula5Text, bodyW);
    checkPageBreak(clausula5Lines.length * 4);
    doc.text(clausula5Lines, lm, y);
    y += clausula5Lines.length * 4 + 6;

    // ─── CLÁUSULA 6ª: DO FORO ───────────────────────────────────────────────────
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLÁUSULA SEXTA – DO FORO`, lm, y);
    y += 5;

    const clausula6Text = `Fica eleito o Foro da Comarca de ${company.municipio || 'São Paulo'} - ${uf}, com renúncia expressa a qualquer outro por mais privilegiado que seja, para dirimir eventuais dúvidas ou controvérsias decorrentes deste contrato.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const clausula6Lines = doc.splitTextToSize(clausula6Text, bodyW);
    checkPageBreak(clausula6Lines.length * 4);
    doc.text(clausula6Lines, lm, y);
    y += clausula6Lines.length * 4 + 10;

    // ─── FECHAMENTO E ASSINATURAS ───────────────────────────────────────────────
    checkPageBreak(50);
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const localDateText = `${company.municipio || 'São Paulo'} - ${uf}, ${hoje}.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(localDateText, W / 2, y, { align: 'center' });
    y += 14;

    // Signature boxes
    const sigPartners = partners.slice(0, 2);
    if (sigPartners.length === 1) {
        doc.setDrawColor(100, 116, 139);
        doc.line(W / 2 - 45, y, W / 2 + 45, y);
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(sigPartners[0].nome_socio.toUpperCase(), W / 2, y, { align: 'center' });
        y += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text('REPRESENTANTE LEGAL / SÓCIO-ADMINISTRADOR', W / 2, y, { align: 'center' });
        y += 3;
        doc.setTextColor(16, 185, 129);
        doc.text('ASSINADO DIGITALMENTE CONFORME MP Nº 2.200-2/2001', W / 2, y, { align: 'center' });
    } else {
        const leftX = lm + 30;
        const rightX = W - rm - 30;

        doc.setDrawColor(100, 116, 139);
        doc.line(leftX - 35, y, leftX + 35, y);
        doc.line(rightX - 35, y, rightX + 35, y);

        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.text(sigPartners[0].nome_socio.toUpperCase().slice(0, 30), leftX, y, { align: 'center' });
        doc.text(sigPartners[1].nome_socio.toUpperCase().slice(0, 30), rightX, y, { align: 'center' });

        y += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text('SÓCIO-ADMINISTRADOR', leftX, y, { align: 'center' });
        doc.text('SÓCIO', rightX, y, { align: 'center' });

        y += 3;
        doc.setTextColor(16, 185, 129);
        doc.text('ASSINATURA DIGITAL ICP-BRASIL', leftX, y, { align: 'center' });
        doc.text('ASSINATURA DIGITAL ICP-BRASIL', rightX, y, { align: 'center' });
    }

    y += 10;
    checkPageBreak(25);
    // Official Certificate Box at the bottom of the last page
    doc.setDrawColor(37, 99, 235);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(lm, y, bodyW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`TERMO DE AUTENTICAÇÃO DIGITAL DA ${junta.sigla}`, lm + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);
    doc.text(`Certificamos que o presente documento arquivado e autenticado digitalmente sob o NIRE ${nire} e Protocolo ${protocolo} cumpre com todas as formalidades do Código Civil e das Instruções Normativas do Departamento de Registro Empresarial e Integração (DREI).`, lm + 4, y + 8, { maxWidth: bodyW - 8 });
    doc.text(`Chave de Verificação: ${hash} • Validação disponível no portal oficial da ${junta.sigla}.`, lm + 4, y + 14);

    return doc.output('blob');
}
