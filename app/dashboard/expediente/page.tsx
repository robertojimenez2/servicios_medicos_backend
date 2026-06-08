"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

// 🎯 NUEVA: Interfaz para validar los comentarios del médico
interface MedicalCommentRead {
  id?: string;
  doctor_uid: string;
  comment: string;
  timestamp?: string;
  date?: string;
  doctor_name?: string;
}

interface HistorialPunto {
  mes: string;
  indice: number;
  weight?: number;
  date?: string;
}

interface PerfilCompleto {
  name: string;
  email: string;
  age: number;
  countryCode: string;
  date: string;
  mes?: string;
  weight: number;
  height: number;
  gender: string;
  activityLevel: string;
  tmb_kcal: number;
  getd_kcal: number;
  imc: number;
  history: HistorialPunto[];
  medical_history?: string;
  blood_type?: string;
  smoking_habits?: string;
  alcohol_habits?: string;
  sleep_hours?: number;
  water_recommendation?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  oxygen_saturation?: number;
  temperature?: number;
  // 🎯 NUEVO: Campo inyectado por FastAPI
  medical_comments?: MedicalCommentRead[];
}

// 🚦 Lógica de Semáforo para Presión Arterial (AHA)
const evaluarPresion = (sys?: number, dia?: number) => {
  if (!sys || !dia)
    return {
      label: "Sin Registro",
      color: "text-slate-400 bg-slate-50 border-slate-200",
    };
  if (sys < 120 && dia < 80)
    return {
      label: "Óptima",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (sys >= 120 && sys <= 129 && dia < 80)
    return {
      label: "Elevada",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89))
    return {
      label: "Hipertensión E1",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    };
  return {
    label: "Hipertensión E2",
    color: "text-red-700 bg-red-50 border-red-200",
  };
};

// 🚦 Lógica de Semáforo para Oxigenación
const evaluarOxigeno = (spo2?: number) => {
  if (!spo2)
    return {
      label: "Sin Registro",
      color: "text-slate-400 bg-slate-50 border-slate-200",
    };
  if (spo2 >= 95)
    return {
      label: "Normal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (spo2 >= 90 && spo2 <= 94)
    return {
      label: "Hipoxia Leve",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    };
  return {
    label: "Hipoxia Severa",
    color: "text-red-700 bg-red-50 border-red-200 animate-pulse",
  };
};

// 🚦 Lógica de Semáforo para Frecuencia Cardíaca
const evaluarPulso = (lpm?: number) => {
  if (!lpm)
    return {
      label: "Sin Registro",
      color: "text-slate-400 bg-slate-50 border-slate-200",
    };
  if (lpm >= 60 && lpm <= 100)
    return {
      label: "Normal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (lpm < 60)
    return {
      label: "Bradicardia",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    };
  return {
    label: "Taquicardia",
    color: "text-red-700 bg-red-50 border-red-200",
  };
};

// 🚦 Lógica de Semáforo para Temperatura
const evaluarTemperatura = (temp?: number) => {
  if (!temp)
    return {
      label: "Sin Registro",
      color: "text-slate-400 bg-slate-50 border-slate-200",
    };
  if (temp >= 36.0 && temp <= 37.3)
    return {
      label: "Normal",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (temp > 37.3 && temp <= 38.0)
    return {
      label: "Febrícula",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  if (temp > 38.0)
    return { label: "Fiebre", color: "text-red-700 bg-red-50 border-red-200" };
  return {
    label: "Hipotermia",
    color: "text-blue-700 bg-blue-50 border-blue-200",
  };
};

export default function ExpedientePage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function obtenerExpediente() {
      if (!user?.uid) return;
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(
          `${baseUrl}/health/users/${encodeURIComponent(user.uid)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setPerfil(data);
        }
      } catch (err) {
        console.error("Error al traer el expediente:", err);
      } finally {
        setLoading(false);
      }
    }
    obtenerExpediente();
  }, [user]);

  const obtenerDiagnosticoIMC = (imc: number) => {
    if (imc < 18.5)
      return {
        label: "Bajo Peso",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    if (imc >= 18.5 && imc <= 24.9)
      return {
        label: "Normal (Saludable)",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    if (imc >= 25 && imc <= 29.9)
      return {
        label: "Sobrepeso",
        color: "bg-orange-50 text-orange-700 border-orange-200",
      };
    return {
      label: "Obesidad Clínico",
      color: "bg-red-50 text-red-700 border-red-200",
    };
  };

  const traducirActividad = (nivel: string) => {
    const mapeo: Record<string, string> = {
      sedentary: "Sedentario",
      light: "Actividad Ligera",
      moderate: "Actividad Moderada",
      active: "Actividad Intensa",
    };
    return mapeo[nivel] || nivel;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Abriendo archivo clínico...
        </p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 font-medium">
          No se encontró ningún expediente activo.
        </p>
        <Link
          href="/dashboard"
          className="text-blue-600 underline text-sm mt-2 inline-block"
        >
          Regresar al inicio
        </Link>
      </div>
    );
  }

  const diagnostico = obtenerDiagnosticoIMC(perfil.imc);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Encabezado del Expediente */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            ID Paciente: {user?.uid}
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1.5">
            Expediente Clínico Digital
          </h1>
          <p className="text-sm text-slate-500">
            Historial médico y metabólico unificado en RobertCare.
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
        {/* Bloque 1: Ficha de Identificación */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Identificación
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium">Nombre</p>
              <p className="font-semibold text-slate-700">{perfil.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Correo Electrónico
              </p>
              <p className="text-slate-600 font-mono text-xs">{perfil.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-400 font-medium">Edad</p>
                <p className="font-semibold text-slate-700">
                  {perfil.age} años
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Región (País)
                </p>
                <p className="font-semibold text-slate-700">
                  {perfil.countryCode || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Biotipo Corporal
              </p>
              <p className="font-semibold text-slate-700 capitalize">
                {perfil.gender === "male" ? "Masculino" : "Femenino"}
              </p>
            </div>
          </div>
        </div>

        {/* Bloque 2: Diagnóstico Metabólico y Calórico */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Análisis Clínico y Energético
          </h3>

          {/* Fila IMC */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Índice de Masa Corporal (IMC)
              </p>
              <p className="text-3xl font-black text-slate-800 mt-0.5">
                {perfil.imc}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-xs font-bold border ${diagnostico.color}`}
            >
              Rango OMS: {diagnostico.label}
            </div>
          </div>

          {/* Fila Fisiológica */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Estatura
              </p>
              <p className="text-lg font-bold text-slate-700">
                {perfil.height} cm
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Peso Actual
              </p>
              <p className="text-lg font-bold text-slate-700">
                {perfil.weight} kg
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Actividad Física
              </p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {traducirActividad(perfil.activityLevel)}
              </p>
            </div>
          </div>

          {/* PANEL DE SIGNOS VITALES */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Signos Vitales y Estado de Alerta
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Presión Arterial */}
              {(() => {
                const status = evaluarPresion(
                  perfil.systolic_bp,
                  perfil.diastolic_bp,
                );
                return (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Presión Art.
                    </p>
                    <p className="text-xl font-black text-slate-700 my-1">
                      {perfil.systolic_bp && perfil.diastolic_bp
                        ? `${perfil.systolic_bp}/${perfil.diastolic_bp}`
                        : "---"}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        mmHg
                      </span>
                    </p>
                    <span
                      className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })()}

              {/* Frecuencia Cardíaca */}
              {(() => {
                const status = evaluarPulso(perfil.heart_rate);
                return (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Frec. Cardíaca
                    </p>
                    <p className="text-xl font-black text-slate-700 my-1">
                      {perfil.heart_rate || "---"}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        LPM
                      </span>
                    </p>
                    <span
                      className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })()}

              {/* Saturación de Oxígeno */}
              {(() => {
                const status = evaluarOxigeno(perfil.oxygen_saturation);
                return (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Saturación SpO₂
                    </p>
                    <p className="text-xl font-black text-slate-700 my-1">
                      {perfil.oxygen_saturation || "---"}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        %
                      </span>
                    </p>
                    <span
                      className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })()}

              {/* Temperatura */}
              {(() => {
                const status = evaluarTemperatura(perfil.temperature);
                return (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Temperatura
                    </p>
                    <p className="text-xl font-black text-slate-700 my-1">
                      {perfil.temperature ? `${perfil.temperature}°` : "---"}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        C
                      </span>
                    </p>
                    <span
                      className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tasas de Gasto Energético */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 border border-slate-100 bg-linear-to-br from-slate-50 to-white rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Metabolismo Basal (TMB)
              </p>
              <p className="text-xl font-black text-blue-600 mt-0.5">
                {perfil.tmb_kcal}{" "}
                <span className="text-xs font-normal text-slate-400">
                  kcal/día
                </span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Gasto mínimo de supervivencia celular.
              </p>
            </div>
            <div className="p-4 border border-slate-100 bg-linear-to-br from-slate-50 to-white rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Gasto Diario Total (GETD)
              </p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {perfil.getd_kcal}{" "}
                <span className="text-xs font-normal text-slate-400">
                  kcal/día
                </span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Calorías quemadas considerando el movimiento.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          🩺 Notas de Evolución e Indicaciones Clínicas
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 mt-2">
          {perfil.medical_comments && perfil.medical_comments.length > 0 ? (
            [...perfil.medical_comments].reverse().map((commentItem, idx) => (
              <div key={commentItem.id || idx} className="relative group">
                {/* Indicador de Nodo en la Línea de Tiempo */}
                <span className="absolute -left-31px top-1 bg-indigo-50 border-2 border-indigo-400 h-3 w-3 rounded-full group-hover:bg-indigo-400 transition-colors" />

                <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-100/80 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs font-bold text-indigo-700">
                        {commentItem.doctor_name ||
                          "Médico Especialista Certificado"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Cédula de Validación: {commentItem.doctor_uid}
                        ...
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-xs">
                      {commentItem.date || "Control Clínico"}
                    </span>
                  </div>

                  {/* Cuerpo del comentario médico */}
                  <p className="text-sm text-slate-700 font-medium mt-2.5 leading-relaxed whitespace-pre-wrap">
                    {commentItem.comment}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 italic text-xs -ml-6">
              👨‍⚕️ Aún no cuentas con prescripciones o comentarios añadidos por tu
              médico en el sistema.
            </div>
          )}
        </div>
      </div>

      {/* Bloque: Tabla de Historial Clínico Manual */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
          Bitácora y Cronología de Consultas (Historial de Peso)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                <th className="py-2.5 px-4">Periodo / Identificador</th>
                <th className="py-2.5 px-4">Índice Clínico (IMC)</th>
                <th className="py-2.5 px-4 text-right">Estatus Clínico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfil.history && perfil.history.length > 0 ? (
                [...perfil.history].reverse().map((item, index) => {
                  const diagItem = obtenerDiagnosticoIMC(item.indice);
                  return (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-600">
                        <span className="block text-xs font-bold text-slate-700">
                          {item.date || "Fecha desconocida"}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Peso reg: {item.weight} kg
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {item.indice}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${diagItem.color}`}
                        >
                          {diagItem.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-6 text-slate-400 italic"
                  >
                    No se registran firmas clínicas anteriores en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloque: Antecedentes Patológicos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          Antecedentes Patológicos
        </h3>
        <div className="text-sm">
          {perfil.medical_history && perfil.medical_history.trim() !== "" ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {perfil.medical_history.split(",").map((condicion, idx) => (
                <span
                  key={idx}
                  className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-lg text-xs font-semibold"
                >
                  {condicion.trim()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-xs">
              No se registran patologías, enfermedades crónicas o allergies
              activas en este paciente.
            </p>
          )}
        </div>
      </div>

      {/* Bloque: Antecedentes No Patológicos / Estilo de Vida */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
            🌱 Estilo de Vida y Hábitos
          </h3>
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase">
            Sangre: {perfil.blood_type || "S/N"}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              Descanso Diario:
            </span>
            <span className="font-semibold text-slate-700">
              {perfil.sleep_hours || 0} hrs / noche
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              Tabaquismo:
            </span>
            <span className="text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
              {perfil.smoking_habits === "no_smoker"
                ? "No Fumador"
                : perfil.smoking_habits === "occasional"
                  ? "Ocasional"
                  : "Activo"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              Consumo Alcohol:
            </span>
            <span className="text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
              {perfil.alcohol_habits === "none"
                ? "Abstemio"
                : perfil.alcohol_habits === "social"
                  ? "Moderado"
                  : "Frecuente"}
            </span>
          </div>

          <div className="mt-2 p-3 bg-blue-50/40 rounded-xl border border-blue-100/40 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                Meta de Hidratación Ideal
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculado por peso anatómico.
              </p>
            </div>
            <p className="text-sm font-black text-blue-600">
              {perfil.water_recommendation
                ? `${(perfil.water_recommendation / 1000).toFixed(2)} L`
                : "0.00 L"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
