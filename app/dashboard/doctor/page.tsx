"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

interface Patient {
  uid: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  imc?: number;
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorUid, setDoctorUid] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<{
    name: string;
    specialty: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [commentText, setCommentText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [busquedaUid, setBusquedaUid] = useState("");
  const [vincularLoading, setVincularLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchPatients = async (uidDoctor: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${apiUrl}/health/doctor/${uidDoctor}/my-patients`,
      );
      if (!response.ok)
        throw new Error("No se pudo recuperar tu núcleo de pacientes.");
      const data = await response.json();
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVincularPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaUid.trim() || !doctorUid) return;
    setVincularLoading(true);
    try {
      const response = await fetch(`${apiUrl}/health/doctor/assign-patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_uid: doctorUid,
          patient_id: busquedaUid.trim(),
        }),
      });
      const resData = await response.json();
      if (response.ok) {
        setToastMessage(resData.message || "Expediente enlazado con éxito.");
        setTimeout(() => setToastMessage(null), 4000);
        setBusquedaUid("");
        fetchPatients(doctorUid);
      } else {
        alert(resData.detail || "Error al asociar el expediente.");
      }
    } catch (err) {
      alert("Error de conexión al enlazar.");
    } finally {
      setVincularLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError("Sesión expirada. Por favor, vuelve a iniciar sesión.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/health/users/${firebaseUser.uid}`);
        if (!res.ok) throw new Error("Error al sincronizar el perfil médico.");
        const userData = await res.json();
        if (userData.role !== "doctor") {
          setError("Acceso denegado. Privilegios insuficientes.");
          setLoading(false);
          return;
        }
        setDoctorUid(firebaseUser.uid);
        setDoctorData({
          name: userData.name,
          specialty: userData.specialty || "Médico General",
        });
        fetchPatients(firebaseUser.uid);
      } catch (err: any) {
        setError(err.message || "Error de red.");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const openCommentModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setCommentText("");
    setIsModalOpen(true);
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorUid || !selectedPatient || !commentText.trim()) return;
    setActionLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/health/users/${selectedPatient.uid}/comments?doctor_uid=${doctorUid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: commentText.trim(),
            category: "general",
          }),
        },
      );
      if (!response.ok) throw new Error("No se pudo inyectar la nota.");
      setToastMessage(
        `Firma clínica aplicada en el perfil de ${selectedPatient.name}.`,
      );
      setTimeout(() => setToastMessage(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Badge IMC — mismo sistema de semáforo del expediente
  const badgeIMC = (imc?: number) => {
    if (!imc)
      return {
        label: "Sin Registro",
        color: "text-slate-400 bg-slate-50 border-slate-200",
      };
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Cargando base de datos clínica...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-xl shadow-lg transition-all">
          <span className="text-emerald-500">✅</span>
          <p className="text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Encabezado — mismo patrón que expediente */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Terminal Médica · {doctorData?.specialty ?? "Cargando..."}
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1.5">
            {doctorData ? `Dr. ${doctorData.name}` : "Portal Clínico"}
          </h1>
          <p className="text-sm text-slate-500">
            Gestión de expedientes y notas clínicas de tu núcleo de pacientes.
          </p>
        </div>
        <button
          onClick={() => doctorUid && fetchPatients(doctorUid)}
          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all self-start sm:self-auto"
        >
          🔄 Sincronizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna izquierda: Vincular paciente */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Incorporar Paciente
          </h3>
          <p className="text-xs text-slate-500">
            Ingresa el ID o correo del paciente para vincularlo a tu consulta.
          </p>

          <form onSubmit={handleVincularPaciente} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                ID o Correo del Paciente
              </label>
              <input
                type="text"
                placeholder="usuario@correo.com"
                value={busquedaUid}
                onChange={(e) => setBusquedaUid(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={vincularLoading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              {vincularLoading ? "Procesando..." : "Vincular Paciente"}
            </button>
          </form>

          {/* Resumen rápido */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400 font-medium">
                Total de pacientes
              </p>
              <p className="text-sm font-black text-slate-700">
                {patients.length}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400 font-medium">Especialidad</p>
              <p className="text-xs font-bold text-blue-600">
                {doctorData?.specialty ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha: Tabla de pacientes */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Directorio de Pacientes
          </h3>

          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <span className="text-4xl mb-3">📁</span>
              <p className="text-sm font-semibold text-slate-500">
                Directorio vacío
              </p>
              <p className="text-xs mt-1 text-slate-400 max-w-xs">
                Usa el panel izquierdo para incorporar pacientes a tu consulta.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                    <th className="py-2.5 px-4">Paciente</th>
                    <th className="py-2.5 px-4">IMC</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => {
                    const imcBadge = badgeIMC(patient.imc);
                    return (
                      <tr
                        key={patient.uid}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700">
                            {patient.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {patient.email}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                            ID: {patient.uid}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${imcBadge.color}`}
                          >
                            {patient.imc ? `${patient.imc.toFixed(1)} · ` : ""}
                            {imcBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/dashboard/doctor/paciente/${patient.uid}`}
                            className="inline-block px-3 py-1.5 mb-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                          >
                            Ver Ficha
                          </Link>
                          <button
                            onClick={() => openCommentModal(patient)}
                            className="inline-block px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                          >
                            📝 Nota
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal — mismo lenguaje visual */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSaveComment} className="flex flex-col">
              {/* Cabecera del modal */}
              <div className="p-5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Nueva Nota Clínica
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2">
                  {selectedPatient.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedPatient.email}
                </p>
              </div>

              {/* Cuerpo */}
              <div className="p-5 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Evolución / Indicaciones
                </label>
                <textarea
                  required
                  rows={5}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Diagnóstico, indicaciones, dosis, observaciones..."
                />
              </div>

              {/* Footer del modal */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 rounded-xl transition-colors shadow-sm"
                >
                  {actionLoading ? "Guardando..." : "Guardar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
