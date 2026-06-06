import React from "react";
import Link from "next/link";

export default function DashboardPage() {
  // Datos simulados (en el futuro vendrán de tu base de datos SQL vía FastAPI)
  const seguroActual = {
    compania: "Seguros SaludVital",
    poliza: "Gastos Médicos Mayores Premium",
    deducible: 2500,
    coaseguro: 10,
    topeCoaseguro: 5000,
    vigencia: "31 Dic 2026",
    moneda: "USD",
  };

  return (
    <div className="space-y-8">
      {/* Mensaje de Bienvenida */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sm:flex sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            ¡Hola de nuevo, Juan!
          </h2>
          <p className="text-slate-600 mt-1">
            Tu salud financiera está protegida. Revisa el estado de tus
            coberturas abajo.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/simulador"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-green-700 hover:bg-green-800 shadow-sm transition-colors cursor-pointer"
          >
            Nueva Simulación Médica →
          </Link>
        </div>
      </div>

      {/* Grid Principal de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1 y 2: Tarjeta de Información de Seguros */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-800 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Tu Póliza Activa</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
              Vigente hasta {seguroActual.vigencia}
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Compañía y Cobertura
              </p>
              <p className="text-xl font-black text-slate-900">
                {seguroActual.compania}
              </p>
              <p className="text-base text-slate-600">{seguroActual.poliza}</p>
            </div>

            <hr className="border-slate-100" />

            {/* Desglose de conceptos financieros clave (Diseño ultra-legible) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 mb-1">
                  Deducible
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  ${seguroActual.deducible.toLocaleString()}{" "}
                  {seguroActual.moneda}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Lo que pagas tú antes de que el seguro responda.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 mb-1">
                  Coaseguro
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  {seguroActual.coaseguro}%
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Tu porcentaje de participación en el gasto total.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 mb-1">
                  Tope de Coaseguro
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  ${seguroActual.topeCoaseguro.toLocaleString()}{" "}
                  {seguroActual.moneda}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Lo máximo que pagarás por concepto de coaseguro.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 3: Educación Financiera en Salud (Accesible para todos) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Glosario Simple
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Entender tus seguros evita sorpresas financieras desagradables
              durante una emergencia médica.
            </p>

            <div className="space-y-3">
              <details className="group border-b border-slate-100 pb-2 cursor-pointer">
                <summary className="text-sm font-bold text-blue-700 flex justify-between items-center list-none">
                  ¿Qué es el Gasto Máximo de Bolsillo?
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-slate-600 mt-2">
                  Es la suma de tu deducible más el tope de coaseguro. Es el
                  "peor escenario financiero"; lo máximo que saldrá de tus
                  ahorros.
                </p>
              </details>

              <details className="group border-b border-slate-100 pb-2 cursor-pointer">
                <summary className="text-sm font-bold text-blue-700 flex justify-between items-center list-none">
                  ¿Qué es una exclusión?
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-slate-600 mt-2">
                  Son enfermedades, tratamientos o condiciones médicas
                  específicas que tu póliza declara explícitamente que no va a
                  pagar.
                </p>
              </details>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
            <strong>Consejo Pro:</strong> Siempre verifica si tus médicos de
            confianza están dentro de la "red hospitalaria" de tu póliza.
          </div>
        </div>
      </div>
    </div>
  );
}
