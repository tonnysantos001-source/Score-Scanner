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
    console.log("=== EMPRESAS USADAS ===");
    const { data: usadas } = await supabase
        .from('empresas_usadas')
        .select('*');

    console.dir(usadas, { depth: null });
}

main().catch(console.error);
