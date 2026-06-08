"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../firebase.config";
import { onAuthStateChanged } from "firebase/auth";

interface Patient {
  uid: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  last_consultation?: string;
  condition?: string;
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

  // Estados para el Modal de Consulta/Comentarios rápidos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [commentText, setCommentText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 📡 1. Cargar pacientes asignados o globales
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ajusta este fetch al endpoint real que uses para listar pacientes (ej: /health/users)
      const response = await fetch(`${apiUrl}/health/users`);

      if (!response.ok) {
        throw new Error(
          "No se pudo recuperar la lista de expedientes clínicos.",
        );
      }

      const data = await response.json();

      // Filtramos para mostrar solo usuarios con rol de paciente común si es necesario,
      // o dejamos la lista que devuelva tu backend.
      setPatients(data.filter((user: any) => user.role === "patient"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ 2. Guardián de la ruta: Valida que sea un Médico Activo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError("Sesión expirada. Por favor, vuelve a iniciar sesión.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/health/users/${firebaseUser.uid}`);
        if (!res.ok)
          throw new Error(
            "Error al sincronizar el perfil médico con el servidor.",
          );

        const userData = await res.json();

        // Si el médico sigue en 'pending_doctor' o es paciente, lo rebotamos
        if (userData.role !== "doctor") {
          setError(
            "Acceso denegado. Este panel requiere una cuenta de Médico Verificada.",
          );
          setLoading(false);
          return;
        }

        setDoctorUid(firebaseUser.uid);
        setDoctorData({
          name: userData.name,
          specialty: userData.specialty || "Médico General",
        });
        console.log(userData);
        fetchPatients();
      } catch (err: any) {
        setError(err.message || "Error de red al validar permisos.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 📝 3. Abrir Modal para añadir Comentario Clínico
  const openCommentModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setCommentText("");
    setIsModalOpen(true);
  };

  // 🚀 4. Enviar diagnóstico/comentario a FastAPI
  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorUid || !selectedPatient || !commentText.trim()) return;

    setActionLoading(true);
    try {
      // Invocamos tu endpoint existente del router: /users/{uid}/comments?doctor_uid=...
      const response = await fetch(
        `${apiUrl}/health/users/${selectedPatient.uid}/comments?doctor_uid=${doctorUid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: commentText.trim(),
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "No se pudo guardar el comentario.");
      }

      setToastMessage(
        `Historial del paciente ${selectedPatient.name} actualizado.`,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans p-6 sm:p-10">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center bg-indigo-500 text-black font-bold px-6 py-4 rounded-xl shadow-2xl border border-indigo-400">
          <span className="mr-3 text-xl text-black">📋</span>
          <p className="text-sm">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-black tracking-widest text-indigo-400 uppercase bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-900">
              Panel Clínico
            </span>
            <h1 className="text-3xl font-black text-black tracking-tight mt-2">
              Bienvenido, {doctorData ? `Dr. ${doctorData.name}` : "Doctor"}
            </h1>
            <p className="text-sm text-slate-900 mt-1">
              Especialidad:{" "}
              <span className="text-slate-900 font-medium">
                {doctorData?.specialty}
              </span>
            </p>
          </div>
          <button
            onClick={fetchPatients}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-indigo-400 text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 hover:text-indigo-300 transition-all active:scale-[0.98]"
          >
            🔄 Sincronizar Pacientes
          </button>
        </div>

        {/* Manejo de Errores Críticos */}
        {error && (
          <div className="p-4 mb-6 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-sm font-semibold">
            ⚠️ Restricción del Sistema: {error}
          </div>
        )}

        {/* Contenido Principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-sm font-bold text-slate-400">
              Descargando expedientes activos...
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {patients.length === 0 ? (
              <div className="p-20 text-center">
                <span className="text-5xl block mb-4">👥</span>
                <h3 className="text-xl font-black text-white">Sin Pacientes</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  No hay expedientes registrados en el sistema de RobertCare
                  actualmente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800">
                      <th className="p-5">Nombre del Paciente</th>
                      <th className="p-5">Edad</th>
                      <th className="p-5">Último Peso Registrado</th>
                      <th className="p-5">Contacto</th>
                      <th className="p-5 text-right">Acciones Médicas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {patients.map((patient) => (
                      <tr
                        key={patient.uid}
                        className="hover:bg-slate-950/50 transition-colors"
                      >
                        <td className="p-5">
                          <div className="font-bold text-white text-base tracking-wide">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            UID: {patient.uid.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="p-5 text-slate-200 font-semibold">
                          {patient.age
                            ? `${patient.age} años`
                            : "No registrada"}
                        </td>
                        <td className="p-5">
                          <span className="font-mono bg-slate-950 text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-800">
                            {patient.weight ? `${patient.weight} kg` : "--"}
                          </span>
                        </td>
                        <td className="p-5 text-slate-400 font-medium">
                          {patient.email}
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => openCommentModal(patient)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-[0.95]"
                          >
                            📝 Añadir Evolución
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 👑 MODAL DE EVOLUCIÓN CLÍNICA (Añadir Comentario) */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden p-1 animate-fadeIn">
            <form onSubmit={handleSaveComment}>
              {/* Cabecera */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Nueva Entrada en Expediente
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paciente:{" "}
                  <span className="text-indigo-400 font-bold">
                    {selectedPatient.name}
                  </span>
                </p>
              </div>

              {/* Cuerpo */}
              <div className="p-6 space-y-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Notas Médicas, Diagnóstico o Recomendaciones
                </label>
                <textarea
                  required
                  rows={5}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none text-sm"
                  placeholder="Escribe aquí las observaciones de la consulta, recetas emitidas o el seguimiento del paciente..."
                />
              </div>

              {/* Acciones */}
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedPatient(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition active:scale-[0.97] disabled:opacity-50"
                >
                  {actionLoading ? "Registrando..." : "Guardar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
