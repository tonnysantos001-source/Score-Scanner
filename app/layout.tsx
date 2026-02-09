import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import "./globals.css";

export const metadata: Metadata = {
  title: "Score Scanner - Plataforma de Inteligência CNPJ",
  description: "Busque, analise e avalie empresas brasileiras com inteligência artificial. Trust Score, dossiês profissionais e muito mais.",
  keywords: ["CNPJ", "consulta CNPJ", "Score empresarial", "análise de empresas", "BrasilAPI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <div className="fixed inset-0 bg-gradient-radial -z-10" />
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
