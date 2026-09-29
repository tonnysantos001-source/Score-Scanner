/**
 * Vercel Domain Manager
 *
 * Centraliza todas as operações de domínio na API da Vercel:
 * 1. Registrar domínio no projeto
 * 2. Buscar o deployment de produção ativo (READY + PROMOTED)
 * 3. Atribuir alias ao deployment de produção → essencial para o tráfego chegar
 */

const VERCEL_API = 'https://api.vercel.com';

function getVercelCredentials(): { token: string; projectId: string; teamId?: string } | null {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
        console.warn('[VercelDomainManager] VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurado');
        return null;
    }

    return { token, projectId, teamId: process.env.VERCEL_TEAM_ID };
}

function buildHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

// ─── 1. Registrar domínio no projeto Vercel ───────────────────────────────────

export async function registerDomainOnVercel(
    domain: string
): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> {
    const creds = getVercelCredentials();
    if (!creds) return { ok: false, error: 'Vercel credentials not configured' };

    const { token, projectId, teamId } = creds;
    const qs = teamId ? `?teamId=${teamId}` : '';

    try {
        const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains${qs}`, {
            method: 'POST',
            headers: buildHeaders(token),
            body: JSON.stringify({ name: domain }),
        });

        const data = await res.json();

        if (res.status === 409 || data.error?.code === 'domain_already_in_use') {
            console.log(`[VercelDomainManager] Domínio ${domain} já registrado (409).`);
            return { ok: true, alreadyExists: true };
        }

        if (!res.ok) {
            console.error('[VercelDomainManager] Erro ao registrar domínio:', data);
            return { ok: false, error: data.error?.message || 'Vercel registration failed' };
        }

        console.log(`[VercelDomainManager] ✅ Domínio ${domain} registrado no projeto Vercel.`);
        return { ok: true };
    } catch (err) {
        console.error('[VercelDomainManager] Exceção ao registrar domínio:', err);
        return { ok: false, error: 'Network error calling Vercel API' };
    }
}

// ─── 2. Buscar deployment de produção ativo ───────────────────────────────────

async function getProductionDeploymentId(): Promise<string | null> {
    const creds = getVercelCredentials();
    if (!creds) return null;

    const { token, projectId, teamId } = creds;
    const qs = teamId ? `&teamId=${teamId}` : '';

    try {
        const res = await fetch(
            `${VERCEL_API}/v6/deployments?projectId=${projectId}&target=production&limit=10${qs}`,
            { headers: buildHeaders(token) }
        );

        if (!res.ok) {
            console.error('[VercelDomainManager] Erro ao listar deployments:', await res.text());
            return null;
        }

        const data = await res.json();
        const deployments: Array<{ uid: string; readyState: string; readySubstate?: string }> =
            data.deployments ?? [];

        // Prioridade: READY + PROMOTED (production ativo)
        const promoted = deployments.find(
            (d) => d.readyState === 'READY' && d.readySubstate === 'PROMOTED'
        );
        if (promoted) {
            console.log(`[VercelDomainManager] Deployment PROMOTED encontrado: ${promoted.uid}`);
            return promoted.uid;
        }

        // Fallback: qualquer READY
        const ready = deployments.find((d) => d.readyState === 'READY');
        if (ready) {
            console.log(`[VercelDomainManager] Deployment READY encontrado: ${ready.uid}`);
            return ready.uid;
        }

        console.warn('[VercelDomainManager] Nenhum deployment READY encontrado.');
        return null;
    } catch (err) {
        console.error('[VercelDomainManager] Exceção ao buscar deployments:', err);
        return null;
    }
}

// ─── 3. Atribuir alias ao deployment de produção ──────────────────────────────

async function assignAliasToDeployment(
    deploymentId: string,
    domain: string
): Promise<{ ok: boolean; error?: string }> {
    const creds = getVercelCredentials();
    if (!creds) return { ok: false, error: 'Vercel credentials not configured' };

    const { token, teamId } = creds;
    const qs = teamId ? `?teamId=${teamId}` : '';

    try {
        const res = await fetch(
            `${VERCEL_API}/v2/deployments/${deploymentId}/aliases${qs}`,
            {
                method: 'POST',
                headers: buildHeaders(token),
                body: JSON.stringify({ alias: domain }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            console.error(`[VercelDomainManager] Erro ao atribuir alias ${domain}:`, data);
            return { ok: false, error: data.error?.message || 'Alias assignment failed' };
        }

        console.log(`[VercelDomainManager] ✅ Alias ${domain} atribuído ao deployment ${deploymentId}.`);
        return { ok: true };
    } catch (err) {
        console.error('[VercelDomainManager] Exceção ao atribuir alias:', err);
        return { ok: false, error: 'Network error assigning alias' };
    }
}

// ─── 4. Fluxo completo: registrar + atribuir alias ────────────────────────────

/**
 * Executa o fluxo completo de ativação de um domínio customizado na Vercel:
 * 1. Registra o domínio no projeto (se ainda não estiver)
 * 2. Busca o deployment de produção ativo
 * 3. Atribui o domínio como alias do deployment
 *
 * Sem o passo 3, a Vercel não sabe qual deployment servir para o domínio
 * e retorna timeout mesmo com DNS e certificado corretos.
 */
export async function activateDomainOnVercel(domain: string): Promise<{
    ok: boolean;
    registered: boolean;
    aliasAssigned: boolean;
    deploymentId?: string;
    error?: string;
}> {
    // Passo 1: Registrar domínio no projeto
    const regResult = await registerDomainOnVercel(domain);
    if (!regResult.ok) {
        return { ok: false, registered: false, aliasAssigned: false, error: regResult.error };
    }

    // Passo 2: Buscar deployment de produção ativo
    const deploymentId = await getProductionDeploymentId();
    if (!deploymentId) {
        console.warn(
            `[VercelDomainManager] ⚠️ Domínio ${domain} registrado mas sem deployment READY para atribuir alias.`
        );
        return { ok: true, registered: true, aliasAssigned: false, error: 'No READY deployment found' };
    }

    // Passo 3: Atribuir alias
    const aliasResult = await assignAliasToDeployment(deploymentId, domain);
    if (!aliasResult.ok) {
        return {
            ok: false,
            registered: true,
            aliasAssigned: false,
            deploymentId,
            error: aliasResult.error,
        };
    }

    return { ok: true, registered: true, aliasAssigned: true, deploymentId };
}
