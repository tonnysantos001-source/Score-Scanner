import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { Providers } from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifyAds — Verifique sua Empresa no Facebook e Desbloqueie Recursos Exclusivos",
  description: "Conecte seu domínio, gere sua landing page verificada e aumente seu limite de anúncios no Meta Business. Planos a partir de $100/mês.",
  keywords: ["verificação Facebook", "Meta Business", "limite anúncios", "WhatsApp Business", "domínio verificado", "CNPJ"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning style={{ fontFamily: "'Inter', sans-serif" }}>
        <Providers>
          <div className="fixed inset-0 bg-gradient-radial -z-10" />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
