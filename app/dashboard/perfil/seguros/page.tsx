"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

interface PatientData {
  uid: string;
  name: string;
  age: number;
  imc: number;
  smoker: boolean;
  smoking_habits?: "no_smoker" | "occasional" | "active";
  systolic_bp?: number;
  diastolic_bp?: number;
}

export default function SimuladorSeguroPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<PatientData | null>(null);
  const [primaMensual, setPrimaMensual] = useState<number>(0);
  const [probabilidadMuerte, setProbabilidadMuerte] = useState<number>(0);

  // Niveles de riesgo para adaptar la interfaz de la cotización: 'normal' | 'alto' | 'critico'
  const [nivelRiesgo, setNivelRiesgo] = useState<"normal" | "alto" | "critico">(
    "normal",
  );

  const COBERTURA_FIJA = 1000000; // $1,000,000 MXN / USD
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function obtenerDatosYCalcular() {
      if (!user?.uid) return;
      try {
        const res = await fetch(`${apiUrl}/health/users/${user.uid}`);
        if (res.ok) {
          const data: PatientData = await res.json();
          setPaciente(data);

          // ==========================================
          // 1. MOTOR ACTUARIAL: CÁLCULO DE LA PRIMA
          // ==========================================
          let factorBase = (COBERTURA_FIJA / 100000) * 15;

          let factorEdad = 1.0;
          if (data.age >= 75) factorEdad = 8.5;
          else if (data.age >= 60) factorEdad = 4.0;
          else if (data.age >= 45) factorEdad = 1.8;
          else if (data.age >= 30) factorEdad = 1.2;

          let factorIMC = 1.0;
          if (data.imc >= 40 || data.imc < 16) factorIMC = 3.5;
          else if (data.imc >= 35) factorIMC = 2.2;
          else if (data.imc >= 30) factorIMC = 1.5;
          else if (data.imc >= 25) factorIMC = 1.15;

          let factorTabaco = 1.0;
          // Soporte híbrido para boolean o enum string según la BD
          const esFumador =
            data.smoker ||
            data.smoking_habits === "active" ||
            data.smoking_habits === "occasional";
          if (esFumador) {
            factorTabaco = data.age > 50 ? 3.0 : 1.8;
          }

          let factorPresion = 1.0;
          if (data.systolic_bp) {
            if (data.systolic_bp >= 180) factorPresion = 5.0;
            else if (data.systolic_bp >= 145) factorPresion = 2.5;
            else if (data.systolic_bp >= 130) factorPresion = 1.4;
          }

          const totalPrima =
            factorBase * factorEdad * factorIMC * factorTabaco * factorPresion;
          setPrimaMensual(Math.round(totalPrima * 100) / 100);

          // ==========================================
          // 2. MODELO DE RIESGO: PROBABILIDAD DE MUERTE ANUALIZADA (%)
          // ==========================================
          // Tasa base biológica por envejecimiento natural (Gompertz-like approximation)
          let probabilidadBase = 0.1; // 0.1% base para jóvenes saludables
          if (data.age >= 75) probabilidadBase = 5.5;
          else if (data.age >= 60) probabilidadBase = 2.0;
          else if (data.age >= 45) probabilidadBase = 0.6;
          else if (data.age >= 30) probabilidadBase = 0.2;

          // Multiplicadores acumulativos clínicos de riesgo relativo (RR)
          let rrIMC = 2.0;
          if (data.imc >= 40 || data.imc < 16) rrIMC = 3.5;
          else if (data.imc >= 35) rrIMC = 2.8;
          else if (data.imc >= 30) rrIMC = 2.3;

          let rrTabaco = esFumador
            ? data.smoking_habits === "occasional"
              ? 1.4
              : 4.1
            : 1.0;

          let rrPresion = 1.0;
          if (data.systolic_bp) {
            if (data.systolic_bp >= 180) rrPresion = 4.5;
            else if (data.systolic_bp >= 145) rrPresion = 2.9;
            else if (data.systolic_bp >= 130) rrPresion = 2.25;
          }

          // Cálculo del riesgo absoluto proyectado a 1 año
          let probFinal = probabilidadBase * rrIMC * rrTabaco * rrPresion;

          // Limitar la probabilidad a un rango lógico (máximo 85% automatizado para evitar overflows extraños)
          if (probFinal > 85) probFinal = 85;
          setProbabilidadMuerte(Math.round(probFinal * 100) / 100);

          // ==========================================
          // 3. DETERMINACIÓN DEL PERFIL DE RIESGO VISUAL
          // ==========================================
          const multiplicadorTotal =
            factorEdad * factorIMC * factorTabaco * factorPresion;
          if (
            multiplicadorTotal >= 6.0 ||
            data.age >= 75 ||
            (data.systolic_bp && data.systolic_bp >= 180) ||
            probFinal >= 5.0
          ) {
            setNivelRiesgo("critico");
          } else if (multiplicadorTotal >= 2.5 || probFinal >= 1.5) {
            setNivelRiesgo("alto");
          } else {
            setNivelRiesgo("normal");
          }
        }
      } catch (err) {
        console.error("Error en el motor de riesgo automatizado:", err);
      } finally {
        setLoading(false);
      }
    }

    obtenerDatosYCalcular();
  }, [user, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Evaluando historial de riesgo y comorbilidades...
        </p>
      </div>
    );
  }

  // Configuración de estilos dinámicos del contenedor según el nivel de riesgo dictado por el algoritmo
  const esquemaDiseño = {
    normal: {
      borde: "from-indigo-500 via-purple-500 to-emerald-500",
      sombra: "shadow-indigo-950/50",
      badgeText: "Póliza Calculada al Instante",
      badgeClase: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
      badgeDot: "bg-emerald-400",
      progresoColor: "bg-emerald-500",
      textoColor: "text-emerald-400",
    },
    alto: {
      borde: "from-amber-600 via-orange-500 to-amber-700",
      sombra: "shadow-orange-950/40",
      badgeText: "Tarifa Ajustada por Riesgo Elevado",
      badgeClase: "text-amber-400 bg-amber-950/60 border-amber-800/60",
      badgeDot: "bg-amber-500",
      progresoColor: "bg-amber-500",
      textoColor: "text-amber-400",
    },
    critico: {
      borde: "from-rose-700 via-red-600 to-rose-900",
      sombra: "shadow-red-950/60",
      badgeText: "Riesgo Clínico Extremo / Tarifa Especial",
      badgeClase: "text-rose-400 bg-rose-950/70 border-rose-800/60",
      badgeDot: "bg-rose-500 animate-ping",
      progresoColor: "bg-rose-600",
      textoColor: "text-rose-400",
    },
  }[nivelRiesgo];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased pt-8 sm:pt-12 px-4 sm:px-8 pb-20">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Cabecera */}
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Pre-aprobación de Seguro de Vida
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            El motor actuarial de RobertCare audita pasivamente tus registros
            médicos para indexar primas en tiempo real basándose en perfiles
            epidemiológicos complejos.
          </p>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: Auditoría Clínica */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-md space-y-4">
            <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
              Métricas Clínicas Utilizadas para el Análisis
            </h2>
            <p className="text-xs text-slate-400">
              Datos extraídos de tu expediente y cruzados con las tablas de
              siniestralidad activa:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Edad de Riesgo:</span>
                <span
                  className={`font-bold text-sm font-mono ${(paciente?.age ?? 0) >= 60 ? "text-rose-400" : "text-white"}`}
                >
                  {paciente?.age || 0} años
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">
                  Índice de Masa Corporal:
                </span>
                <span
                  className={`font-bold text-sm font-mono ${paciente && (paciente.imc >= 35 || paciente.imc < 16) ? "text-rose-400" : paciente && paciente.imc >= 25 ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {paciente?.imc ? `${paciente.imc.toFixed(1)} kg/m²` : "N/A"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Consumo de Tabaco:</span>
                <span
                  className={`font-bold text-sm ${
                    paciente?.smoking_habits === "active" || paciente?.smoker
                      ? "text-rose-400"
                      : paciente?.smoking_habits === "occasional"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {paciente?.smoking_habits === "no_smoker" ||
                  (!paciente?.smoker && !paciente?.smoking_habits)
                    ? "No Fumador"
                    : paciente?.smoking_habits === "occasional"
                      ? "Ocasional"
                      : "Activo"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">
                  Presión Arterial Máxima:
                </span>
                <span
                  className={`font-bold text-sm font-mono ${paciente && (paciente.systolic_bp ?? 0) >= 145 ? "text-rose-400" : "text-white"}`}
                >
                  {paciente?.systolic_bp && paciente?.diastolic_bp
                    ? `${paciente.systolic_bp}/${paciente.diastolic_bp} mmHg`
                    : "Estable"}
                </span>
              </div>
            </div>

            {nivelRiesgo !== "normal" && (
              <div
                className={`text-[11px] rounded-xl p-3 border leading-relaxed ${
                  nivelRiesgo === "critico"
                    ? "bg-rose-950/30 text-rose-300 border-rose-900/50"
                    : "bg-amber-950/30 text-amber-300 border-amber-900/50"
                }`}
              >
                ⚠️ **Aviso de recargo:** Tu tarifa mensual se ha incrementado
                significativamente debido a que detectamos factores críticos que
                elevan exponencialmente el riesgo biológico.
              </div>
            )}
          </div>

          {/* Columna Derecha: Recuadro con Mutación de Color Reactiva */}
          <div
            className={`relative overflow-hidden rounded-2xl p-2px bg-linear-to-b ${esquemaDiseño.borde} shadow-2xl ${esquemaDiseño.sombra} transition-all duration-500`}
          >
            <div className="bg-slate-900 rounded-[14px] p-6 h-full flex flex-col justify-between space-y-5">
              <div className="text-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${esquemaDiseño.badgeClase}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${esquemaDiseño.badgeDot}`}
                  ></span>
                  {esquemaDiseño.badgeText}
                </span>

                <div className="mt-5 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tu Prima Mensual Indexada
                  </span>

                  {/* Despliegue masivo del precio alterado */}
                  <div
                    className={`text-4xl sm:text-5xl font-black tracking-tight font-mono mt-1 ${
                      nivelRiesgo === "critico"
                        ? "text-rose-400"
                        : nivelRiesgo === "alto"
                          ? "text-amber-400"
                          : "text-white"
                    }`}
                  >
                    {primaMensual.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </div>

                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    Suma Asegurada:{" "}
                    {COBERTURA_FIJA.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              {/* NUEVO COMPONENTE: Indicador de Probabilidad de Muerte Exponencial */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">
                    Índice de Mortalidad Actuarial (Anualizado):
                  </span>
                  <span
                    className={`font-mono font-black ${esquemaDiseño.textoColor} text-sm`}
                  >
                    {probabilidadMuerte}%
                  </span>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${esquemaDiseño.progresoColor} transition-all duration-1000 ease-out`}
                    style={{
                      width: `${Math.min(probabilidadMuerte * 10, 100)}%`,
                    }} // Escalado x10 para que sea perceptible visualmente incluso en rangos del 1% al 10%
                  />
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Probabilidad estadística basada en tablas actuariales cruzadas
                  con tus biométricos actuales de RobertCare.
                </p>
              </div>

              {/* Bloque Informativo según Severidad */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-2 text-xs">
                {nivelRiesgo === "critico" ? (
                  <p className="text-rose-300 text-center leading-relaxed">
                    🚨 **Suscripción Restringida:** Debido a tus alarmantes
                    indicadores biométricos actuales, esta tarifa incluye un
                    recargo de siniestralidad forzoso. La póliza requerirá
                    ratificación manual antes de emitirse.
                  </p>
                ) : nivelRiesgo === "alto" ? (
                  <p className="text-amber-300 text-center leading-relaxed">
                    ⚠️ **Tarifa Agravada:** Ciertos indicadores clínicos se
                    encuentran fuera de los rangos óptimos de salud pública, lo
                    que impacta de manera directa en el costo mensual de
                    protección.
                  </p>
                ) : (
                  <p className="text-emerald-300 text-center leading-relaxed">
                    ✅ **Estatus Preferencial:** Tu perfil biológico se mantiene
                    dentro del umbral saludable estándar de la plataforma
                    RobertCare.
                  </p>
                )}
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                *Cálculo pasivo generado de forma automatizada por la mesa de
                riesgo RobertCare Seguros. Las alteraciones críticas en tus
                consultas modifican este valor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
