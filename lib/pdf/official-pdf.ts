import jsPDF from 'jspdf';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';

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
    } catch {
        return '';
    }
}

function fmtDate(val?: string): string {
    if (!val) return '********';
    try {
        return new Date(val).toLocaleDateString('pt-BR');
    } catch {
        return val;
    }
}

interface PDFOverrides {
    telefone?: string;
    email?: string;
}

export async function generateOfficialPDF(
    company: EnhancedCompanyData,
    overrides: PDFOverrides = {}
): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');

    const W = doc.internal.pageSize.getWidth();   // 210
    const lm = 15;          // left margin
    const rm = 15;          // right margin
    const body = W - lm - rm; // content width ~180
    const LBL = 7;           // label font size
    const VAL = 9;           // value font size

    let y = 15;

    // ── BRASÃO ──────────────────────────────────────────────────────────────
    try {
        const logo = await loadImageAsBase64('/brasil-coat-of-arms.png');
        if (logo) doc.addImage(logo, 'PNG', lm, y, 22, 22);
    } catch { /* silently skip */ }

    // ── TÍTULO ──────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', W / 2, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.text('CADASTRO NACIONAL DA PESSOA JURÍDICA', W / 2, y + 14, { align: 'center' });

    y += 28;

    // ── HELPERS ─────────────────────────────────────────────────────────────

    /** Draw a bordered cell with a label and value */
    const cell = (
        x: number, cellY: number, w: number, h: number,
        label: string, value: string,
        opts: { fontSize?: number; bold?: boolean } = {}
    ) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.25);
        doc.rect(x, cellY, w, h);

        // label
        doc.setFontSize(LBL);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(label.toUpperCase(), x + 1.5, cellY + 3.5);

        // value
        const fs = opts.fontSize ?? VAL;
        doc.setFontSize(fs);
        doc.setFont('helvetica', opts.bold === false ? 'normal' : 'bold');
        doc.setTextColor(0, 0, 0);

        const maxW = w - 3;
        const lines = doc.splitTextToSize(value || '********', maxW);
        // if the text overflows and height allows two lines
        if (lines.length > 1 && h >= 14) {
            doc.text(lines[0], x + 1.5, cellY + h * 0.55);
            doc.setFontSize(fs - 1);
            doc.text(lines[1], x + 1.5, cellY + h * 0.75);
        } else {
            if (lines.length > 1) doc.setFontSize(Math.max(6, fs - 1));
            doc.text(lines[0], x + 1.5, cellY + h * 0.72);
        }
    };

    /** Full-width row */
    const row1 = (label: string, value: string, h = 10) => {
        cell(lm, y, body, h, label, value);
        y += h;
    };

    // ────────────────────────────────────────────────────────────────────────
    // ROW 1: CNPJ (+ MATRIZ) | COMPROVANTE (title) | DATA DE ABERTURA
    // Official: 3 cells
    // ────────────────────────────────────────────────────────────────────────
    const cnpjW = body * 0.28;
    const compW = body * 0.50;
    const abertW = body * 0.22;

    // CNPJ cell (with MATRIZ below)
    doc.setDrawColor(0); doc.setLineWidth(0.25);
    doc.rect(lm, y, cnpjW, 12);
    doc.setFontSize(LBL); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text('NÚMERO DE INSCRIÇÃO', lm + 1.5, y + 3.5);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    doc.text(formatCNPJ(company.cnpj), lm + 1.5, y + 7.5);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
    doc.text('MATRIZ', lm + 1.5, y + 11);

    // COMPROVANTE cell
    const xComp = lm + cnpjW;
    doc.rect(xComp, y, compW, 12);
    doc.setFontSize(LBL); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text('COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL', xComp + 1.5, y + 3.5);
    // no value — it's the title box

    // DATA DE ABERTURA
    const xAbert = xComp + compW;
    doc.rect(xAbert, y, abertW, 12);
    doc.setFontSize(LBL); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text('DATA DE ABERTURA', xAbert + 1.5, y + 3.5);
    doc.setFontSize(VAL); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    doc.text(fmtDate(company.data_inicio_atividade || company.data_abertura), xAbert + 1.5, y + 8.5);

    y += 12;

    // ── ROW 2: NOME EMPRESARIAL (full width, h=10) ─────────────────────────
    row1('NOME EMPRESARIAL', company.razao_social);

    // ── ROW 3: NOME FANTASIA | PORTE ──────────────────────────────────────
    const nfW = body * 0.80;
    const ptW = body * 0.20;
    cell(lm, y, nfW, 10, 'TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)', company.nome_fantasia || '********');
    cell(lm + nfW, y, ptW, 10, 'PORTE', company.porte === 'MICRO EMPRESA' ? 'ME' : (company.porte || 'ME'));
    y += 10;

    // ── ROW 4: ATIVIDADE ECONÔMICA PRINCIPAL ─────────────────────────────
    const cnaePrincipal = company.cnae_fiscal && company.cnae_fiscal_descricao
        ? `${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`
        : '********';
    row1('CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL', cnaePrincipal, 12);

    // ── ROW 5: ATIVIDADES ECONÔMICAS SECUNDÁRIAS ──────────────────────────
    const secundarios = company.cnaes_secundarios && company.cnaes_secundarios.length > 0
        ? company.cnaes_secundarios.map(c => `${c.codigo} - ${c.descricao}`).join(' / ')
        : '********';
    row1('CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS', secundarios, 12);

    // ── ROW 6: NATUREZA JURÍDICA ─────────────────────────────────────────
    const natJur = company.codigo_natureza_juridica
        ? `${company.codigo_natureza_juridica} - Sociedade Empresária Limitada`
        : '206-2 - Sociedade Empresária Limitada';
    row1('CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA', natJur);

    // ── ROW 7: LOGRADOURO | NÚMERO | COMPLEMENTO ─────────────────────────
    const logradouro = [
        company.descricao_tipo_de_logradouro,
        company.logradouro,
    ].filter(Boolean).join(' ').trim() || '********';

    const lgrW = body * 0.58;
    const numW = body * 0.12;
    const compW2 = body * 0.30;

    cell(lm, y, lgrW, 10, 'LOGRADOURO', logradouro);
    cell(lm + lgrW, y, numW, 10, 'NÚMERO', company.numero || '********');
    cell(lm + lgrW + numW, y, compW2, 10, 'COMPLEMENTO', company.complemento || '********');
    y += 10;

    // ── ROW 8: CEP | BAIRRO/DISTRITO | MUNICÍPIO | UF ────────────────────
    const cepW = body * 0.18;
    const bairW = body * 0.25;
    const munW = body * 0.47;
    const ufW = body * 0.10;

    cell(lm, y, cepW, 10, 'CEP', company.cep || '********');
    cell(lm + cepW, y, bairW, 10, 'BAIRRO/DISTRITO', company.bairro || '********');
    cell(lm + cepW + bairW, y, munW, 10, 'MUNICÍPIO', company.municipio || '********');
    cell(lm + cepW + bairW + munW, y, ufW, 10, 'UF', company.uf || '**');
    y += 10;

    // ── ROW 9: ENDEREÇO ELETRÔNICO | TELEFONE ────────────────────────────
    const emailVal = overrides.email || company.email || company.custom_email || '********';
    const telVal = overrides.telefone || company.ddd_telefone_1 || company.telefone || company.custom_phone || '********';

    const emW = body * 0.60;
    const telW = body * 0.40;
    cell(lm, y, emW, 10, 'ENDEREÇO ELETRÔNICO', emailVal, { fontSize: 8 });
    cell(lm + emW, y, telW, 10, 'TELEFONE', telVal);
    y += 10;

    // ── ROW 10: ENTE FEDERATIVO RESPONSÁVEL (EFR) ─────────────────────────
    row1('ENTE FEDERATIVO RESPONSÁVEL (EFR)', '*****');

    // ── ROW 11: SITUAÇÃO CADASTRAL | DATA DA SITUAÇÃO CADASTRAL ──────────
    const sitW = body * 0.60;
    const dtSitW = body * 0.40;
    cell(lm, y, sitW, 10, 'SITUAÇÃO CADASTRAL', company.tipo_situacao_cadastral || 'ATIVA');
    cell(lm + sitW, y, dtSitW, 10, 'DATA DA SITUAÇÃO CADASTRAL',
        fmtDate(company.data_situacao_cadastral));
    y += 10;

    // ── ROW 12: MOTIVO DE SITUAÇÃO CADASTRAL (full width) ─────────────────
    row1('MOTIVO DE SITUAÇÃO CADASTRAL', company.motivo_situacao_cadastral || '');

    // ── ROW 13: SITUAÇÃO ESPECIAL | DATA DA SITUAÇÃO ESPECIAL ────────────
    const sitEspW = body * 0.70;
    const dtEspW = body * 0.30;
    cell(lm, y, sitEspW, 10, 'SITUAÇÃO ESPECIAL', '********');
    cell(lm + sitEspW, y, dtEspW, 10, 'DATA DA SITUAÇÃO ESPECIAL',
        fmtDate(company.data_especial));
    y += 10;

    // ── FOOTER ────────────────────────────────────────────────────────────
    y += 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60, 60, 60);
    doc.text(
        'Aprovado pela Instrução Normativa RFB nº 1.863, de 27 de dezembro de 2018.',
        W / 2, y, { align: 'center' }
    );
    y += 5;
    doc.setFontSize(6.5);
    doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} via VerifyAds`,
        W / 2, y, { align: 'center' }
    );

    return doc.output('blob');
}
