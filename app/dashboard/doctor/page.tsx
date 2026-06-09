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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col items-center pt-8 sm:pt-16 px-4 sm:px-8 pb-20">
      {/* Toast Notification de alto contraste */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-500 text-emerald-100 px-6 py-4 rounded-xl shadow-2xl transition-all">
          <span className="text-emerald-400 text-xl">✅</span>
          <p className="text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      <div className="w-full max-w-6xl flex flex-col gap-8">
        {/* Header Sólido y Nítido */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg">
          <div>
            <div className="inline-block px-3 py-1 bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-md mb-3">
              Terminal Médica
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {doctorData ? `Dr. ${doctorData.name}` : "Portal Clínico"}
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-2">
              Especialidad:{" "}
              <span className="text-indigo-400 font-bold">
                {doctorData?.specialty}
              </span>
            </p>
          </div>

          <button
            onClick={() => doctorUid && fetchPatients(doctorUid)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            🔄 Sincronizar
          </button>
        </header>

        {/* Módulo de Vinculación con inputs legibles */}
        {doctorUid && (
          <section className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-bold text-white">
                Incorporar Paciente al Núcleo
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Digita el ID o correo del paciente para importarlo.
              </p>
            </div>
            <form
              onSubmit={handleVincularPaciente}
              className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3"
            >
              <input
                type="text"
                placeholder="ID del paciente o correo..."
                value={busquedaUid}
                onChange={(e) => setBusquedaUid(e.target.value)}
                className="w-full sm:w-80 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                required
              />
              <button
                type="submit"
                disabled={vincularLoading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {vincularLoading ? "Procesando..." : "Vincular Paciente"}
              </button>
            </form>
          </section>
        )}

        {/* Errores */}
        {error && (
          <div className="p-5 bg-rose-950 border border-rose-700 text-rose-200 rounded-xl text-sm font-bold flex items-center gap-3 shadow-md">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Tabla de Datos de Alto Contraste */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Cargando base de datos
            </p>
          </div>
        ) : (
          <main className="bg-slate-900 border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <span className="text-5xl mb-4">📁</span>
                <h3 className="text-xl font-bold text-white">
                  Directorio vacío
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mt-2">
                  No tienes pacientes enlazados. Usa la barra superior para
                  buscarlos e integrarlos a tu consulta.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <th className="p-5 pl-8">Paciente</th>
                      <th className="p-5">Contacto</th>
                      <th className="p-5 pr-8 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {patients.map((patient) => (
                      <tr
                        key={patient.uid}
                        className="hover:bg-slate-800 transition-colors"
                      >
                        <td className="p-5 pl-8">
                          <div className="font-bold text-white text-base">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            ID: {patient.uid}
                          </div>
                        </td>

                        <td className="p-5 text-slate-300 font-medium">
                          {patient.email}
                        </td>

                        <td className="p-5 pr-8 text-right space-x-3">
                          <Link
                            href={`/dashboard/doctor/paciente/${patient.uid}`}
                            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Ver Ficha
                          </Link>

                          <button
                            onClick={() => openCommentModal(patient)}
                            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md active:scale-95 cursor-pointer"
                          >
                            📝 Nota
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Modal Clínico con Fondo Opaco Sólido */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSaveComment} className="flex flex-col">
              <div className="p-6 border-b border-slate-700 bg-slate-950">
                <h3 className="text-xl font-bold text-white">
                  Nueva Nota Médica
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Paciente:{" "}
                  <span className="text-indigo-400 font-bold">
                    {selectedPatient.name}
                  </span>
                </p>
              </div>

              <div className="p-6 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Escribe la Evolución
                </label>
                <textarea
                  required
                  rows={6}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none"
                  placeholder="Diagnóstico, indicaciones, dosis..."
                />
              </div>

              <div className="px-6 py-4 bg-slate-950 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md disabled:opacity-50 cursor-pointer"
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
