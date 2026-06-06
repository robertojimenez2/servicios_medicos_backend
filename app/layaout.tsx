import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // Asegúrate de que aquí se importe Tailwind

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SanaPrevisión - Finanzas y Salud",
  description:
    "Simulador de riesgo financiero en salud y gestión de gastos médicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
