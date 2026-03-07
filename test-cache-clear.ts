import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envObj: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envObj[match[1]] = match[2];
});

const supabase = createClient(
    envObj['NEXT_PUBLIC_SUPABASE_URL'],
    envObj['SUPABASE_SERVICE_ROLE_KEY'] || envObj['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function main() {
    console.log("=== LIMPANDO A WHITELIST === ");
    const { data: whitelistData, error: countError } = await supabase
        .from('cnpj_whitelist')
        .select('cnpj');

    if (countError) {
        console.error("Erro ao buscar contagem:", countError);
        return;
    }

    if (!whitelistData || whitelistData.length === 0) {
        console.log("Whitelist já está vazia.");
        return;
    }

    console.log(`Apagando ${whitelistData.length} registros...`);

    // Deleting all entries
    const { error: deleteError } = await supabase
        .from('cnpj_whitelist')
        .delete()
        .neq('cnpj', '0'); // deletes everything

    if (deleteError) {
        console.error("Erro ao apagar:", deleteError);
    } else {
        console.log("✅ Whitelist limpa com sucesso! O próximo mining irá refazer tudo do zero.");
    }
}

main().catch(console.error);
