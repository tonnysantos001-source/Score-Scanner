import * as https from 'https';

function fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Parse error', data });
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    const cnpj = '53104500000130';

    console.log("=== BRASIL API ===");
    const bApi = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    console.log("Response:", bApi);

    console.log("\n=== RECEITA WS ===");
    const rWs = await fetchJson(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    console.log("Response:", rWs);

    console.log("\n=== PUBLIC CNPJ.WS ===");
    const cWs = await fetchJson(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    console.log("Capital:", cWs.estabelecimento?.capital_social || cWs.capital_social || cWs);
}

main().catch(console.error);
