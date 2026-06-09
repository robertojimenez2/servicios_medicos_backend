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

  // Estado para controlar la animación de carga del PDF
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

  // Manejador de descarga de archivo clínico unificado
  const handleDescargarExpediente = async () => {
    if (!uid) return;
    setDescargandoPDF(true);

    try {
      // Consumimos el endpoint del router de FastAPI que configuramos previamente
      const res = await fetch(`${apiUrl}/health/users/${uid}/expediente-pdf`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(
          "El archivo clínico no pudo ser generado por el servidor.",
        );
      }

      // Convertimos la respuesta binaria (StreamingResponse) en un archivo Blob
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);

      // Creamos un disparador de descarga invisible en el navegador
      const link = document.createElement("a");
      link.href = urlBlob;

      const nombreLimpio = perfil?.name
        ? perfil.name.replace(/\s+/g, "_")
        : uid;
      link.setAttribute("download", `Expediente_${nombreLimpio}.pdf`);

      document.body.appendChild(link);
      link.click();

      // Limpieza de memoria
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Desencriptando expediente...
        </p>
      </div>
    );
  }

  if (errorAcceso) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-rose-950 border border-rose-700 p-8 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="text-4xl">🚨</div>
          <p className="text-rose-200 font-bold text-sm leading-relaxed">
            {errorAcceso}
          </p>
          <Link
            href="/dashboard/doctor"
            className="inline-block w-full px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
          >
            Volver a mi Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pt-8 sm:pt-16 px-4 sm:px-8 pb-20">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Encabezado Principal Sólido con Botón de Descarga integrado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg">
          <div>
            <Link
              href="/dashboard/doctor"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mb-3 inline-flex items-center gap-1"
            >
              <span>←</span> Volver a mis pacientes
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Expediente:{" "}
              <span className="text-slate-300 font-medium">{perfil?.name}</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-2">
              ID / UID: {perfil?.uid}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Nuevo Botón de Exportación PDF */}
            <button
              onClick={handleDescargarExpediente}
              disabled={descargandoPDF}
              className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer border ${
                descargandoPDF
                  ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md hover:shadow-lg active:scale-95"
              }`}
            >
              {descargandoPDF ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Compilando PDF...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">📥</span>
                  <span>DESCARGAR EXPEDIENTE</span>
                </>
              )}
            </button>

            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-950 border border-emerald-700 text-emerald-400 rounded-xl font-bold text-xs tracking-wide shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Acceso Autorizado
            </div>
          </div>
        </div>

        {/* Grid Superior: Métricas Básicas e Índices de Salud */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
              Información Base
            </h2>
            <div className="text-sm space-y-3 text-slate-300">
              <p>
                📧 <span className="font-bold text-white ml-1">Email:</span>{" "}
                {perfil?.email}
              </p>
              <p>
                🎂 <span className="font-bold text-white ml-1">Edad:</span>{" "}
                {perfil?.age} años
              </p>
              <p>
                🧬 <span className="font-bold text-white ml-1">Género:</span>{" "}
                {perfil?.gender === "male" ? "Masculino" : "Femenino"}
              </p>
              <p>
                🩸{" "}
                <span className="font-bold text-white ml-1">
                  Tipo de Sangre:
                </span>{" "}
                {perfil?.blood_type}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
              Antropometría Básica
            </h2>
            <div className="text-sm space-y-3 text-slate-300">
              <p>
                ⚖️{" "}
                <span className="font-bold text-white ml-1">
                  Peso Corporal:
                </span>{" "}
                {perfil?.weight} kg
              </p>
              <p>
                📏 <span className="font-bold text-white ml-1">Estatura:</span>{" "}
                {perfil?.height} cm
              </p>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span>
                  🧮{" "}
                  <span className="font-bold text-white ml-1">
                    IMC Calculado:
                  </span>
                </span>
                <span className="font-bold text-indigo-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-700">
                  {perfil?.imc}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
              Gasto Energético
            </h2>
            <div className="text-sm space-y-3 text-slate-300">
              <p>
                🔥{" "}
                <span className="font-bold text-white ml-1">TMB (Basal):</span>{" "}
                {perfil?.tmb_kcal} kcal
              </p>
              <p>
                ⚡{" "}
                <span className="font-bold text-white ml-1">
                  GETD (Mantenimiento):
                </span>{" "}
                {perfil?.getd_kcal} kcal
              </p>
            </div>
          </div>
        </div>

        {/* Bloque de Signos Vitales */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg space-y-5">
          <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
            Último Tamizaje de Signos Vitales
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Presión Arterial
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {perfil?.systolic_bp && perfil?.diastolic_bp
                  ? `${perfil.systolic_bp}/${perfil.diastolic_bp}`
                  : "S/R"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                mmHg
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Frec. Cardíaca
              </span>
              <span className="text-lg font-black font-mono text-rose-400">
                {perfil?.heart_rate || "S/R"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                LPM
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Saturación O₂
              </span>
              <span className="text-lg font-black font-mono text-sky-400">
                {perfil?.oxygen_saturation
                  ? `${perfil.oxygen_saturation}%`
                  : "S/R"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                SpO₂
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Temperatura
              </span>
              <span className="text-lg font-black font-mono text-amber-400">
                {perfil?.temperature ? `${perfil.temperature}°C` : "S/R"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Axilar
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Historial Médico
              </span>
              <span className="text-xs font-bold text-slate-300 truncate mt-1">
                {perfil?.medical_history || "Ninguno"}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de Comentarios y Línea de Tiempo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Formulario de Redacción */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg h-fit space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">
                Añadir Diagnóstico
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                La nota se firmará automáticamente con tu nombre y cédula
                médica.
              </p>
            </div>

            <form onSubmit={handleAñadirComentario} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Categoría Clínica
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="general">Consulta General</option>
                  <option value="nutricion">Nutrición & Metabolismo</option>
                  <option value="cardiologia">
                    Cardiología / Control Vital
                  </option>
                  <option value="urgente">Indicación Crítica / Alerta</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Cuerpo de la Recomendación
                </label>
                <textarea
                  placeholder="Escribe dosis, pautas de entrenamiento, diagnóstico..."
                  rows={6}
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={enviandoComentario}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {enviandoComentario
                  ? "Estampando Firma..."
                  : "Guardar Diagnóstico"}
              </button>
            </form>
          </div>

          {/* Main Area: Línea de Tiempo del Historial Médico */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-lg space-y-8">
            <h3 className="font-bold text-xl text-white border-b border-slate-800 pb-4">
              Evolución Clínica y Notas Vigentes
            </h3>

            <div className="relative border-l-2 border-slate-700 ml-4 pl-8 space-y-8">
              {perfil?.medical_comments &&
              perfil.medical_comments.length > 0 ? (
                perfil.medical_comments.map((item, index) => (
                  <div key={item.id || index} className="relative group">
                    <span className="absolute -left-[39px] top-1.5 bg-slate-950 border-4 border-indigo-500 h-4 w-4 rounded-full group-hover:border-indigo-400 transition-colors" />

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-700 group-hover:border-slate-600 transition-colors shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {item.doctor_name}
                          </h4>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                            {item.specialty || "Medicina General"}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-600 px-3 py-1 rounded-lg self-start sm:self-auto">
                          {item.date}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mt-4 leading-relaxed whitespace-pre-wrap border-t border-slate-800 pt-3">
                        {item.comment}
                      </p>

                      <div className="mt-4 flex">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-sm py-12 -ml-8 flex flex-col items-center">
                  <span className="text-4xl mb-3 opacity-50">📋</span>
                  <p>
                    El paciente no registra anotaciones previas en la red de
                    RobertCare.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
