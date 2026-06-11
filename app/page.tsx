"use client";
import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const segurosInformativos = [
    {
      id: 1,
      nombre: "Plan Joven Esencial",
      enfoque: "Ideal para profesionales independientes de 18 a 30 años.",
      deducible: "Bajo ($1,000 USD)",
      coaseguro: "10%",
      ventaja:
        "Cobertura total en accidentes y consultas preventivas digitales.",
      topBorderColor: "border-t-teal-500",
    },
    {
      id: 2,
      nombre: "Protección Familiar Integral",
      enfoque: "Diseñado para cubrir a padres e hijos en un solo contrato.",
      deducible: "Medio ($2,500 USD)",
      coaseguro: "10% (Topado)",
      ventaja:
        "Incluye maternidad, pediatría y red hospitalaria de nivel medio.",
      topBorderColor: "border-t-blue-600",
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
      topBorderColor: "border-t-purple-600",
    },
    {
      id: 4,
      nombre: "Plenitud Senior",
      enfoque: "Cobertura especializada para adultos mayores de 60 años.",
      deducible: "Personalizable",
      coaseguro: "20% (Con tope bajo)",
      ventaja:
        "Enfocado en geriatría, rehabilitación física y cuidados en casa.",
      topBorderColor: "border-t-amber-500",
    },
  ];

  return (
    // FONDO GLOBAL: Blanco absoluto en día / Slate-950 en noche
    <div className="min-h-screen bg-white dark:bg-slate-955 font-sans text-black dark:text-slate-300 transition-colors duration-500 overflow-x-hidden">
      {/* NAVBAR (Sincronizado con fondos claros/oscuros y sombras limpias) */}
      <Navbar />
      {/* HERO */}
      <header className="relative bg-white dark:bg-slate-955 border-b border-slate-100 dark:border-slate-900 py-24 lg:py-32 transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 text-black">
          <h1
            className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-black dark:text-white leading-none transition-all duration-1500 ease-out transform ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Tu salud no debería quebrar tus finanzas. <br />
            <span className="inline-block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:to-indigo-500">
              RobertCare
            </span>
          </h1>

          <p
            className={`max-w-2xl mx-auto text-xl text-black/90 dark:text-slate-400 font-medium leading-relaxed transition-all duration-1500 ease-out delay-200 transform ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            Plataforma de centro médico y de seguros.
          </p>
        </div>
      </header>

      {/* SEGUROS */}
      <section
        id="seguros"
        className="max-w-7xl mx-auto px-6 py-24 space-y-16 bg-white dark:bg-slate-955 transition-colors duration-500"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tight">
            Explora las Coberturas Disponibles
          </h2>
          <p className="text-lg text-black/70 dark:text-slate-500 font-medium">
            Nuestra lógica de simulación analiza estos cuatro perfiles base para
            proyectar tus gastos médicos máximos de bolsillo.
          </p>
        </div>

        {/* REJILLA DE TARJETAS BLANCAS CON SHADOW-BOX Y BORDE SUPERIOR DE COLOR */}
        {/* GRID DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {segurosInformativos.map((seguro) => (
            <div
              key={seguro.id}
              // 1. Añadimos h-full para asegurar que todas llenen la altura de la cuadrícula
              className={`
                card-anim group bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col h-full
                border-t-4 ${seguro.topBorderColor} border-x border-b border-slate-200 dark:border-slate-800
                text-black dark:text-white
              `}
            >
              {/* 2. Cabecera de la tarjeta: Título y descripción (Se queda arriba) */}
              <div>
                <h3 className="text-lg font-black tracking-tight mb-3">
                  {seguro.nombre}
                </h3>
                <p className="text-sm font-bold leading-relaxed text-black/90 dark:text-slate-400">
                  {seguro.enfoque}
                </p>
              </div>

              {/* 3. El bloque inferior: Lo empujamos hacia abajo con mt-auto */}
              <div className="mt-auto flex flex-col">
                <hr className="border-slate-200 dark:border-slate-800 my-5" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-black/60 dark:text-slate-500">
                      Deducible Base:
                    </span>
                    <span className="font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {seguro.deducible}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-black/60 dark:text-slate-500">
                      Coaseguro:
                    </span>
                    <span className="font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {seguro.coaseguro}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800 my-5" />

                {/* 4. Ventaja clave: Parallax interno sutil al hacer hover */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                    Ventaja Clave
                  </span>
                  <p className="text-xs font-bold leading-relaxed text-black dark:text-slate-300">
                    {seguro.ventaja}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 py-10 text-center text-xs text-black dark:text-slate-600 font-bold">
        © 2026 RobertCare. Proyecto Abierto de Ingeniería en Software y
        Previsión Financiera.
      </footer>
    </div>
  );
}
