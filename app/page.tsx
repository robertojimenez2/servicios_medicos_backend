import React from "react";
import Link from "next/link";

export default function LandingPage() {
  // Datos de los 4 seguros para mostrar consistencia en la información
  const segurosInformativos = [
    {
      id: 1,
      nombre: "Plan Joven Esencial",
      enfoque: "Ideal para profesionales independientes de 18 a 30 años.",
      deducible: "Bajo ($1,000 USD)",
      coaseguro: "10%",
      ventaja:
        "Cobertura total en accidentes y consultas preventivas digitales.",
      color: "border-t-teal-500",
    },
    {
      id: 2,
      nombre: "Protección Familiar Integral",
      enfoque: "Diseñado para cubrir a padres e hijos en un solo contrato.",
      deducible: "Medio ($2,500 USD)",
      coaseguro: "10% (Topado)",
      ventaja:
        "Incluye maternidad, pediatría y red hospitalaria de nivel medio.",
      color: "border-t-blue-600",
    },
    {
      id: 3,
      nombre: "SanaPrevisión Crónica",
      enfoque:
        "Para personas con antecedentes familiares de riesgo o diagnóstico previo.",
      deducible: "Alto ($4,000 USD)",
      coaseguro: "15%",
      ventaja:
        "Acceso a tratamientos de alta especialidad y medicamentos oncológicos.",
      color: "border-t-purple-600",
    },
    {
      id: 4,
      nombre: "Plenitud Senior",
      enfoque: "Cobertura especializada para adultos mayores de 60 años.",
      deducible: "Personalizable",
      coaseguro: "20% (Con tope bajo)",
      ventaja:
        "Enfocado en geriatría, rehabilitación física y cuidados en casa.",
      color: "border-t-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* 1. NAVBAR BÁSICO */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <span className="text-xl font-black text-blue-800 tracking-tight">
            RobertCare
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-semibold text-slate-600 hover:text-blue-800 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Registrarme gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. ENCABEZADO GRANDE IMPRESIONANTE (HERO SECTION) */}
      <header className="relative bg-white border-b border-slate-200 overflow-hidden py-20 lg:py-32 animate-hero">
        {/* Fondo decorativo sutil para dar impacto visual sin arruinar el contraste */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-8">
          {/* Nombre RobertCare con diseño masivo y gradiente */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-none reveal-2">
            Tu salud no debería quebrar tus finanzas. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-green-700">
              RobertCare
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 font-medium leading-relaxed reveal-3">
            La primera plataforma de ingeniería de software médica orientada a
            desmitificar tus pólizas de seguro. Simula riesgos, calcula
            deducibles y toma el control.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 reveal-4">
            <a
              href="#seguros"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-xl shadow-lg shadow-slate-900/10 transition-all text-center cursor-pointer"
            >
              Conocer Coberturas ↓
            </a>
            <Link
              href="/auth"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-blue-700 border-2 border-blue-100 text-base font-bold rounded-xl transition-all text-center"
            >
              Probar el Simulador →
            </Link>
          </div>
        </div>
      </header>

      {/* 3. SECCIÓN DE LOS 4 SEGUROS */}
      <section
        id="seguros"
        className="max-w-7xl mx-auto px-6 py-20 space-y-12滚动"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
            Explora las Coberturas Disponibles
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Nuestra lógica de simulación analiza estos cuatro perfiles base para
            proyectar tus gastos médicos máximos de bolsillo.
          </p>
        </div>

        {/* Grid de Tarjetas Consistentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {segurosInformativos.map((seguro) => (
            <div
              key={seguro.id}
              className={`card-anim group transform-gpu bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1 border-t-4 ${seguro.color}`}
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {seguro.nombre}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {seguro.enfoque}
                </p>

                <hr className="border-slate-100" />

                {/* Datos técnicos presentados de forma ultra-limpia */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Deducible Base:</span>
                    <span className="text-slate-900 font-bold">
                      {seguro.deducible}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Coaseguro:</span>
                    <span className="text-slate-900 font-bold">
                      {seguro.coaseguro}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">
                    Ventaja Clave
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    {seguro.ventaja}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href="/auth"
                  className="block w-full text-center py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Simular Escenario Financiero
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER ACCESIBLE */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400 font-medium">
        © 2026 RobertCare. Proyecto Abierto de Ingeniería en Software y
        Financiera.
      </footer>
    </div>
  );
}
