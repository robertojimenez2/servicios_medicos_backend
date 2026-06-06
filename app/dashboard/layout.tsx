import React from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra de Navegación Superior Consistente */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo / Identidad */}
              <Link
                href="/dashboard"
                className="text-xl font-black text-blue-800 tracking-tight"
              >
                SanaPrevisión
              </Link>

              {/* Menú Principal Accesible */}
              <div className="hidden md:flex space-x-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-bold text-blue-700 bg-blue-50"
                >
                  Mi Panel
                </Link>
                <Link
                  href="/dashboard/simulador"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors"
                >
                  Simulador de Riesgo
                </Link>
                <Link
                  href="/dashboard/Historial"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors"
                >
                  Historial Médico
                </Link>
              </div>
            </div>

            {/* Perfil de Usuario / Cerrar Sesión */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Juan Pérez</p>
                <p className="text-xs text-slate-500">Plan Personal</p>
              </div>
              <Link
                href="/auth"
                className="text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                Salir
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Dinámico de las Páginas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
