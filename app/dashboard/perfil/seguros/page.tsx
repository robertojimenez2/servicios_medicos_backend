"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";

interface PatientData {
  uid: string;
  name: string;
  age: number;
  imc: number;
  smoker: boolean;
  smoking_habits?: "no_smoker" | "occasional" | "heavy";
  systolic_bp?: number;
  diastolic_bp?: number;
}

export default function SimuladorSeguroPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<PatientData | null>(null);
  const [primaMensual, setPrimaMensual] = useState<number>(0);
  const [probabilidadMuerte, setProbabilidadMuerte] = useState<number>(0);
  const [nivelRiesgo, setNivelRiesgo] = useState<"normal" | "alto" | "critico">(
    "normal",
  );

  const COBERTURA_FIJA = 1000000;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function obtenerDatosYCalcular() {
      if (!user?.uid) return;
      try {
        const res = await fetch(`${apiUrl}/health/users/${user.uid}`);
        if (res.ok) {
          const data: PatientData = await res.json();
          setPaciente(data);

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
          const esFumador =
            data.smoker ||
            data.smoking_habits === "heavy" ||
            data.smoking_habits === "occasional";
          if (esFumador) factorTabaco = data.age > 50 ? 3.0 : 1.8;

          let factorPresion = 1.0;
          if (data.systolic_bp) {
            if (data.systolic_bp >= 180) factorPresion = 5.0;
            else if (data.systolic_bp >= 145) factorPresion = 2.5;
            else if (data.systolic_bp >= 130) factorPresion = 1.4;
          }

          const totalPrima =
            factorBase * factorEdad * factorIMC * factorTabaco * factorPresion;
          setPrimaMensual(Math.round(totalPrima * 100) / 100);

          let probabilidadBase = 0.1;
          if (data.age >= 75) probabilidadBase = 5.5;
          else if (data.age >= 60) probabilidadBase = 2.0;
          else if (data.age >= 45) probabilidadBase = 0.6;
          else if (data.age >= 30) probabilidadBase = 0.2;

          let rrIMC = 2.0;
          if (data.imc >= 40 || data.imc < 16) rrIMC = 3.5;
          else if (data.imc >= 35) rrIMC = 2.8;
          else if (data.imc >= 30) rrIMC = 2.3;

          let rrTabaco = esFumador
            ? data.smoking_habits === "occasional"
              ? 1.4
              : 4.1
            : 4.1;

          console.log(rrTabaco);
          let rrPresion = 1.0;
          if (data.systolic_bp) {
            if (data.systolic_bp >= 180) rrPresion = 4.5;
            else if (data.systolic_bp >= 145) rrPresion = 2.9;
            else if (data.systolic_bp >= 130) rrPresion = 2.25;
          }

          let probFinal = probabilidadBase * rrIMC * rrTabaco * rrPresion;
          setProbabilidadMuerte(Math.round(probFinal * 100) / 100);

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

  // ── Semáforos (mismo patrón que expediente) ──────────────────────────────
  const badgeRiesgo = {
    normal: {
      label: "Perfil Preferencial",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      dot: "bg-emerald-500",
    },
    alto: {
      label: "Riesgo Elevado",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
    },
    critico: {
      label: "Riesgo Crítico",
      color: "text-red-700 bg-red-50 border-red-200",
      dot: "bg-red-500 animate-ping",
    },
  }[nivelRiesgo];

  const badgeTabaco = () => {
    if (!paciente)
      return {
        label: "Sin Registro",
        color: "text-slate-400 bg-slate-50 border-slate-200",
      };
    const h = paciente.smoking_habits;
    if (h === "heavy" || paciente.smoker)
      return {
        label: "Fumador Activo",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (h === "occasional")
      return {
        label: "Ocasional",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      label: "No Fumador",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  };

  const badgePresion = () => {
    const sys = paciente?.systolic_bp;
    const dia = paciente?.diastolic_bp;
    if (!sys || !dia)
      return {
        label: "Sin Registro",
        color: "text-slate-400 bg-slate-50 border-slate-200",
      };
    if (sys >= 180)
      return {
        label: "Hipertensión E2",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (sys >= 145)
      return {
        label: "Hipertensión E2",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (sys >= 130)
      return {
        label: "Hipertensión E1",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      };
    if (sys >= 120)
      return {
        label: "Elevada",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      label: "Óptima",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  };

  const badgeEdad = () => {
    const age = paciente?.age ?? 0;
    if (age >= 75)
      return {
        label: "Riesgo Muy Alto",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (age >= 60)
      return {
        label: "Riesgo Alto",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      };
    if (age >= 45)
      return {
        label: "Riesgo Moderado",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      label: "Riesgo Bajo",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  };

  const badgeIMC = () => {
    const imc = paciente?.imc ?? 0;
    if (imc >= 40 || imc < 16)
      return {
        label: "Obesidad Mórbida",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (imc >= 35)
      return {
        label: "Obesidad E2",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (imc >= 30)
      return {
        label: "Obesidad E1",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      };
    if (imc >= 25)
      return {
        label: "Sobrepeso",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    if (imc >= 18.5)
      return {
        label: "Normal",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    return {
      label: "Bajo Peso",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  };

  const barColor = {
    normal: "bg-emerald-500",
    alto: "bg-amber-500",
    critico: "bg-red-500",
  }[nivelRiesgo];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Evaluando historial de riesgo...
        </p>
      </div>
    );
  }

  const tabaco = badgeTabaco();
  const presion = badgePresion();
  const edad = badgeEdad();
  const imc = badgeIMC();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Encabezado — idéntico al expediente */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            ID Paciente: {user?.uid}
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1.5">
            Simulador de Seguro de Vida
          </h1>
          <p className="text-sm text-slate-500">
            Prima indexada en tiempo real con base en tus biométricos de
            RobertCare.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all self-start sm:self-auto"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna izquierda: Auditoría Clínica */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Métricas de Riesgo
          </h3>
          <div className="space-y-3 text-sm">
            {/* Edad */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">Edad</p>
                <p className="font-semibold text-slate-700">
                  {paciente?.age ?? "—"} años
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${edad.color}`}
              >
                {edad.label}
              </span>
            </div>

            {/* IMC */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Índice de Masa Corporal
                </p>
                <p className="font-semibold text-slate-700 font-mono">
                  {paciente?.imc ? `${paciente.imc.toFixed(1)} kg/m²` : "—"}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${imc.color}`}
              >
                {imc.label}
              </span>
            </div>

            {/* Tabaco */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">Tabaquismo</p>
                <p className="font-semibold text-slate-700">{tabaco.label}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${tabaco.color}`}
              >
                {tabaco.label}
              </span>
            </div>

            {/* Presión */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Presión Arterial
                </p>
                <p className="font-semibold text-slate-700 font-mono">
                  {paciente?.systolic_bp && paciente?.diastolic_bp
                    ? `${paciente.systolic_bp}/${paciente.diastolic_bp} mmHg`
                    : "Sin registro"}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${presion.color}`}
              >
                {presion.label}
              </span>
            </div>
          </div>

          {/* Aviso si hay riesgo */}
          {nivelRiesgo !== "normal" && (
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                nivelRiesgo === "critico"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              ⚠️ Tu tarifa incluye un recargo por factores clínicos fuera del
              umbral saludable.
            </div>
          )}
        </div>

        {/* Columna derecha: Prima + Riesgo */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Cotización Actuarial
          </h3>

          {/* Bloque Prima */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Prima Mensual Indexada
              </p>
              <p className="text-3xl font-black text-slate-800 mt-0.5 font-mono">
                {primaMensual.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Suma asegurada:{" "}
                {COBERTURA_FIJA.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${badgeRiesgo.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${badgeRiesgo.dot}`} />
              {badgeRiesgo.label}
            </div>
          </div>

          {/* Grid de factores multiplicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Factor Edad
              </p>
              <p className="text-lg font-bold text-slate-700">
                {(paciente?.age ?? 0) >= 75
                  ? "x8.5"
                  : (paciente?.age ?? 0) >= 60
                    ? "x4.0"
                    : (paciente?.age ?? 0) >= 45
                      ? "x1.8"
                      : (paciente?.age ?? 0) >= 30
                        ? "x1.2"
                        : "x1.0"}
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Factor IMC
              </p>
              <p className="text-lg font-bold text-slate-700">
                {paciente?.imc && (paciente.imc >= 40 || paciente.imc < 16)
                  ? "×3.5"
                  : paciente?.imc && paciente.imc >= 35
                    ? "×2.2"
                    : paciente?.imc && paciente.imc >= 30
                      ? "×1.5"
                      : paciente?.imc && paciente.imc >= 25
                        ? "×1.15"
                        : "×1.0"}
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Factor Tabaco
              </p>
              <p className="text-lg font-bold text-slate-700">
                {paciente?.smoking_habits === "heavy" || paciente?.smoker
                  ? paciente.age > 50
                    ? "×3.0"
                    : "×1.8"
                  : paciente?.smoking_habits === "occasional"
                    ? "×1.8"
                    : "×1.0"}
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Factor Presión
              </p>
              <p className="text-lg font-bold text-slate-700">
                {paciente?.systolic_bp && paciente.systolic_bp >= 180
                  ? "×5.0"
                  : paciente?.systolic_bp && paciente.systolic_bp >= 145
                    ? "×2.5"
                    : paciente?.systolic_bp && paciente.systolic_bp >= 130
                      ? "×1.4"
                      : "×1.0"}
              </p>
            </div>
          </div>

          {/* Índice de Mortalidad */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Índice de Mortalidad Actuarial (Anualizado)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Probabilidad estimada de siniestro
                  </p>
                  <p
                    className={`text-xl font-black font-mono ${
                      nivelRiesgo === "critico"
                        ? "text-red-600"
                        : nivelRiesgo === "alto"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {probabilidadMuerte}%
                  </p>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full`}
                    style={{
                      width: `${Math.min(probabilidadMuerte * 10, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Calculado con tablas actuariales cruzadas con tus biométricos
                  registrados en RobertCare.
                </p>
              </div>
            </div>
          </div>

          {/* Bloque informativo final */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 border border-slate-100 bg-linear-to-br from-slate-50 to-white rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Cobertura Total
              </p>
              <p className="text-xl font-black text-blue-600 mt-0.5">
                {COBERTURA_FIJA.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Suma asegurada fija por póliza estándar RobertCare.
              </p>
            </div>
            <div className="p-4 border border-slate-100 bg-linear-to-br from-slate-50 to-white rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Costo Anual Estimado
              </p>
              <p
                className={`text-xl font-black mt-0.5 ${
                  nivelRiesgo === "critico"
                    ? "text-red-600"
                    : nivelRiesgo === "alto"
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {(primaMensual * 12).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Proyección anual sin ajuste por variaciones clínicas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nota legal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          * Cálculo generado de forma automatizada por la mesa de riesgo
          RobertCare Seguros. Las alteraciones en tus consultas clínicas
          modifican este valor en tiempo real. Este simulador no constituye una
          oferta formal de seguro.
        </p>
      </div>
    </div>
  );
}
