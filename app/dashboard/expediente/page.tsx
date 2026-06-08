"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

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
}

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

  // 🟢 Función auxiliar para diagnosticar el rango de IMC según la OMS
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

          {/* Tasas de Gasto Energético */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 border border-slate-100 bg-gradient-to-br from-slate-50 to-white rounded-xl">
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
            <div className="p-4 border border-slate-100 bg-gradient-to-br from-slate-50 to-white rounded-xl">
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

      {/* Bloque 3: Tabla de Historial Clínico Manual */}
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
                // Invertimos el array para mostrar los registros más recientes primero
                [...perfil.history].reverse().map((item, index) => {
                  const diagItem = obtenerDiagnosticoIMC(item.indice);
                  return (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-600">
                        Registro Clínico — {item.mes}
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
      {/* 📂 Busca el final del "Bloque 1: Ficha de Identificación" e inserta esta tarjeta abajo: */}

      {/* 🎯 NUEVO Bloque: Antecedentes Patológicos / Historial de Enfermedades */}
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
              No se registran patologías, enfermedades crónicas o alergias
              activas en este paciente.
            </p>
          )}
        </div>
      </div>
      {/* 📂 En expediente/page.tsx, busca el final de la tarjeta de "Antecedentes Patológicos" (que agregamos antes) y coloca esta tarjeta justo abajo: */}

      {/* 🎯 NUEVO Bloque: Antecedentes No Patológicos / Estilo de Vida */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
            🌱 Estilo de Vida y Hábitos
          </h3>
          {/* 🩸 Badge de Tipo de Sangre con diseño de alta visibilidad */}
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase">
            Sangre: {perfil.blood_type || "S/N"}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          {/* Descanso */}
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              Descanso Diario:
            </span>
            <span className="font-semibold text-slate-700">
              {perfil.sleep_hours || 0} hrs / noche
            </span>
          </div>

          {/* Tabaquismo */}
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

          {/* Alcoholismo */}
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

          {/* Hidratación calculada mecánicamente */}
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
