"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link"; // 🚀 Importación crucial para navegación SPA

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // 🔒 Protección de ruta a nivel de Layout
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // 🎯 Si está cargando el Auth, o si hay un usuario pero el rol aún no se ha mapeado/cargado
  // (Modifica 'user.role' aquí si en tu AuthContext manejas un flag como 'loadingRole')
  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <p className="text-blue-600 font-medium animate-pulse">
          Cargando panel...
        </p>
      </div>
    );
  }

  // 🎯 Variable de control segura
  const esPaciente = user?.role === "patient";

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* 1. BARRA LATERAL (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 md:flex">
        <div>
          <div className="p-2 mb-6">
            <h1 className="text-xl font-bold text-white tracking-wide">
              RobertCare
            </h1>
            <p className="text-xs text-slate-400">Panel de Control Médico</p>
          </div>

          <nav className="space-y-1">
            {/* 🏠 Botón de Inicio (Habilitado solo para pacientes) */}
            {esPaciente ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium"
              >
                <span>🏠</span> <span>Inicio</span>
              </Link>
            ) : (
              <div
                className="flex items-center space-x-3 px-3 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed select-none"
                title="Botón deshabilitado para tu rol"
              >
                <span>🏠</span> <span>Inicio</span>
              </div>
            )}

            {/* 📊 Métricas de Salud (Solo se muestra si es paciente) */}
            {esPaciente && (
              <Link
                href="/dashboard/expediente"
                className="flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                <span>📊</span> <span>Métricas de Salud</span>
              </Link>
            )}
            {esPaciente && (
              <Link
                href="/dashboard/perfil/seguros"
                className="flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                <span>📊</span> <span>Simulador Seguros</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Botón de cerrar sesión al fondo */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          <span>🚪</span> <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Navbar Superior Móvil / Usuario */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <button className="md:hidden text-slate-600 text-xl">☰</button>
          <div className="ml-auto flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {esPaciente ? "Paciente activo" : "Usuario activo"}
              </p>
              <p className="text-sm font-medium text-slate-700">{user.email}</p>
            </div>
            <div className="h-9 w-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Renderizado de las páginas hijas */}
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
