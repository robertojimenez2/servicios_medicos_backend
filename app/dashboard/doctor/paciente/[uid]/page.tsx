"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Link from "next/link";

interface MedicalComment {
  id: string;
  comment: string;
  doctor_name: string;
  specialty: string;
  category: string;
  date: string;
}

interface PatientProfile {
  uid: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  imc: number;
  tmb_kcal: number;
  getd_kcal: number;
  blood_type: string;
  medical_history: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  oxygen_saturation?: number;
  temperature?: number;
  medical_comments?: MedicalComment[];
}

export default function PatientFilePage() {
  const { uid } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [categoria, setCategoria] = useState("general");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const cargarExpedienteSeguro = async () => {
    if (!uid || !user?.uid) return;
    try {
      const res = await fetch(
        `${apiUrl}/health/doctor/patient/${uid}?doctor_uid=${user.uid}`,
      );
      if (res.status === 403) {
        setErrorAcceso(
          "No autorizado. Este paciente no pertenece a tu núcleo asignado.",
        );
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setErrorAcceso("No se pudo recuperar el expediente clínico.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPerfil(data);
    } catch (err) {
      console.error(err);
      setErrorAcceso("Error de conexión con el servidor de RobertCare.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarExpedienteSeguro();
  }, [uid, user]);

  const handleDescargarExpediente = async () => {
    if (!uid) return;
    setDescargandoPDF(true);
    try {
      const res = await fetch(`${apiUrl}/health/users/${uid}/expediente-pdf`, {
        method: "GET",
      });
      if (!res.ok)
        throw new Error(
          "El archivo clínico no pudo ser generado por el servidor.",
        );
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      const nombreLimpio = perfil?.name
        ? perfil.name.replace(/\s+/g, "_")
        : uid;
      link.setAttribute("download", `Expediente_${nombreLimpio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error al descargar el reporte.");
    } finally {
      setDescargandoPDF(false);
    }
  };

  const handleAñadirComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !uid || !user?.uid) return;
    setEnviandoComentario(true);
    try {
      const res = await fetch(
        `${apiUrl}/health/users/${uid}/comments?doctor_uid=${user.uid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: nuevoComentario.trim(),
            category: categoria,
          }),
        },
      );
      if (res.ok) {
        setNuevoComentario("");
        await cargarExpedienteSeguro();
      } else {
        alert("Error al intentar firmar y guardar la anotación médica.");
      }
    } catch (err) {
      alert("Error de red.");
    } finally {
      setEnviandoComentario(false);
    }
  };

  // ── Semáforos — mismo sistema que expediente ─────────────────────────────
  const evaluarPresion = (sys?: number, dia?: number) => {
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
    if (sys >= 130 || dia >= 80)
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
    if (spo2 >= 90)
      return {
        label: "Hipoxia Leve",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      };
    return {
      label: "Hipoxia Severa",
      color: "text-red-700 bg-red-50 border-red-200",
    };
  };

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
      return {
        label: "Fiebre",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    return {
      label: "Hipotermia",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    };
  };

  const badgeCategoria = (cat: string) => {
    const map: Record<string, string> = {
      general: "text-blue-700 bg-blue-50 border-blue-200",
      nutricion: "text-emerald-700 bg-emerald-50 border-emerald-200",
      cardiologia: "text-rose-700 bg-rose-50 border-rose-200",
      urgente: "text-red-700 bg-red-50 border-red-200",
    };
    return map[cat] || "text-slate-600 bg-slate-50 border-slate-200";
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Abriendo expediente clínico...
        </p>
      </div>
    );
  }

  if (errorAcceso) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-5 shadow-sm">
          <div className="text-4xl">🚨</div>
          <p className="text-red-700 font-semibold text-sm leading-relaxed">
            {errorAcceso}
          </p>
          <Link
            href="/dashboard/doctor"
            className="inline-block w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            Volver a mi Panel
          </Link>
        </div>
      </div>
    );
  }

  const presion = evaluarPresion(perfil?.systolic_bp, perfil?.diastolic_bp);
  const pulso = evaluarPulso(perfil?.heart_rate);
  const oxigeno = evaluarOxigeno(perfil?.oxygen_saturation);
  const temperatura = evaluarTemperatura(perfil?.temperature);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Encabezado — mismo patrón que expediente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/dashboard/doctor"
            className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            ← Volver a mis pacientes
          </Link>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1.5">
            Expediente:{" "}
            <span className="text-slate-500 font-medium">{perfil?.name}</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            ID / UID: {perfil?.uid}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleDescargarExpediente}
            disabled={descargandoPDF}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            {descargandoPDF ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Compilando PDF...
              </>
            ) : (
              <>📥 Descargar Expediente</>
            )}
          </button>

          <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Acceso Autorizado
          </div>
        </div>
      </div>

      {/* Grid Superior: 3 tarjetas informativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información Base */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Información Base
          </h2>
          <div className="text-sm space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Correo Electrónico
              </p>
              <p className="font-mono text-xs text-slate-600">
                {perfil?.email}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-400 font-medium">Edad</p>
                <p className="font-semibold text-slate-700">
                  {perfil?.age} años
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Género</p>
                <p className="font-semibold text-slate-700">
                  {perfil?.gender === "male" ? "Masculino" : "Femenino"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Tipo de Sangre
              </p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-bold rounded-full border text-rose-700 bg-rose-50 border-rose-200">
                {perfil?.blood_type || "Sin registro"}
              </span>
            </div>
          </div>
        </div>

        {/* Antropometría */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Antropometría Básica
          </h2>
          <div className="text-sm space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-400 font-medium">Peso</p>
                <p className="font-semibold text-slate-700">
                  {perfil?.weight} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Estatura</p>
                <p className="font-semibold text-slate-700">
                  {perfil?.height} cm
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  IMC Calculado
                </p>
                <p className="text-2xl font-black text-slate-800 font-mono">
                  {perfil?.imc}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border text-slate-500 bg-slate-50 border-slate-200">
                kg/m²
              </span>
            </div>
          </div>
        </div>

        {/* Gasto Energético */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Gasto Energético
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Metabolismo Basal (TMB)
              </p>
              <p className="text-xl font-black text-blue-600 mt-0.5">
                {perfil?.tmb_kcal}{" "}
                <span className="text-xs font-normal text-slate-400">
                  kcal/día
                </span>
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Gasto Total (GETD)
              </p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {perfil?.getd_kcal}{" "}
                <span className="text-xs font-normal text-slate-400">
                  kcal/día
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signos Vitales — mismo sistema de semáforo que expediente */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
          Último Tamizaje de Signos Vitales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {/* Presión */}
          <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Presión Art.
            </p>
            <p className="text-xl font-black text-slate-700 my-1 font-mono">
              {perfil?.systolic_bp && perfil?.diastolic_bp
                ? `${perfil.systolic_bp}/${perfil.diastolic_bp}`
                : "---"}{" "}
              <span className="text-[10px] font-normal text-slate-400">
                mmHg
              </span>
            </p>
            <span
              className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${presion.color}`}
            >
              {presion.label}
            </span>
          </div>

          {/* Pulso */}
          <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Frec. Cardíaca
            </p>
            <p className="text-xl font-black text-slate-700 my-1 font-mono">
              {perfil?.heart_rate || "---"}{" "}
              <span className="text-[10px] font-normal text-slate-400">
                LPM
              </span>
            </p>
            <span
              className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${pulso.color}`}
            >
              {pulso.label}
            </span>
          </div>

          {/* Oxígeno */}
          <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Saturación SpO₂
            </p>
            <p className="text-xl font-black text-slate-700 my-1 font-mono">
              {perfil?.oxygen_saturation
                ? `${perfil.oxygen_saturation}`
                : "---"}{" "}
              <span className="text-[10px] font-normal text-slate-400">%</span>
            </p>
            <span
              className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${oxigeno.color}`}
            >
              {oxigeno.label}
            </span>
          </div>

          {/* Temperatura */}
          <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Temperatura
            </p>
            <p className="text-xl font-black text-slate-700 my-1 font-mono">
              {perfil?.temperature ? `${perfil.temperature}°` : "---"}{" "}
              <span className="text-[10px] font-normal text-slate-400">C</span>
            </p>
            <span
              className={`text-[9px] font-bold text-center px-1.5 py-0.5 rounded-md border ${temperatura.color}`}
            >
              {temperatura.label}
            </span>
          </div>

          {/* Historial */}
          <div className="col-span-2 sm:col-span-1 p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Historial Médico
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
              {perfil?.medical_history || "Sin antecedentes registrados"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid inferior: Formulario + Línea de tiempo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Formulario */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Añadir Diagnóstico
          </h3>
          <p className="text-xs text-slate-500">
            La nota se firmará automáticamente con tu nombre y cédula médica.
          </p>

          <form onSubmit={handleAñadirComentario} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Categoría Clínica
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Consulta General</option>
                <option value="nutricion">Nutrición & Metabolismo</option>
                <option value="cardiologia">Cardiología / Control Vital</option>
                <option value="urgente">Indicación Crítica / Alerta</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Cuerpo de la Recomendación
              </label>
              <textarea
                placeholder="Diagnóstico, dosis, indicaciones..."
                rows={5}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={enviandoComentario}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              {enviandoComentario ? "Guardando..." : "Guardar Diagnóstico"}
            </button>
          </form>
        </div>

        {/* Main: Línea de tiempo */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            🩺 Evolución Clínica y Notas Vigentes
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 mt-2">
            {perfil?.medical_comments && perfil.medical_comments.length > 0 ? (
              [...perfil.medical_comments].reverse().map((item, index) => (
                <div key={item.id || index} className="relative group">
                  <span className="absolute -left-[31px] top-1 bg-indigo-50 border-2 border-indigo-400 h-3 w-3 rounded-full group-hover:bg-indigo-400 transition-colors" />

                  <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-100/80 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-bold text-indigo-700">
                          {item.doctor_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {item.specialty || "Medicina General"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-xs shrink-0">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 font-medium mt-2.5 leading-relaxed whitespace-pre-wrap">
                      {item.comment}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeCategoria(item.category)}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 italic text-xs -ml-6">
                📋 El paciente no registra anotaciones previas en la red de
                RobertCare.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
