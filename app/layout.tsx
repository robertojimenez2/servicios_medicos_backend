import "./globals.css";
import ThemeToggle from "./components/ThemeToggle"; // Importa tu nuevo botón nativo
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Tu aplicación vuelve a ser estándar y robusta */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
