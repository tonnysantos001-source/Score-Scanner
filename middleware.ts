import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// MIDDLEWARE TEMPORARIAMENTE DESABILITADO
// O middleware estava causando erro 503 no deploy
// Será reativado após correções adicionais

export function middleware(request: NextRequest) {
    // Por enquanto, apenas deixar tudo passar sem processar
    return NextResponse.next();
}

// Matcher vazio = não processa nada
export const config = {
    matcher: [],
};
