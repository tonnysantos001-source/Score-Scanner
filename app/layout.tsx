import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { Providers } from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: "Score Scanner - Plataforma de Inteligência CNPJ",
  description: "Busque, analise e avalie empresas brasileiras com inteligência artificial. Trust Score, dossiês profissionais e muito mais.",
  keywords: ["CNPJ", "consulta CNPJ", "Score empresarial", "análise de empresas", "BrasilAPI"],
  icons: {
    icon: '/logo.png', // Usando logo.png como favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <Providers>
          <div className="fixed inset-0 bg-gradient-radial -z-10" />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
