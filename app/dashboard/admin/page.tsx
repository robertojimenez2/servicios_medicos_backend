"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../firebase.config";
import { onAuthStateChanged } from "firebase/auth";

interface Doctor {
  uid: string;
  name: string;
  email: string;
  specialty: string;
  medical_license: string;
  age: number;
  countryCode: string;
}

export default function AdminDashboard() {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminUid, setAdminUid] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchPendingDoctors = async (uid: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${apiUrl}/health/admin/pending-doctors?admin_uid=${uid}`,
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.detail || "No se pudo cargar la lista de médicos.",
        );
      }

      const data = await response.json();
      setPendingDoctors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError("No hay ninguna sesión activa. Por favor, inicia sesión.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/health/users/${firebaseUser.uid}`);
        if (!res.ok)
          throw new Error("No se pudo verificar el perfil en el servidor.");

        const userData = await res.json();

        if (userData.role !== "admin") {
          setError(
            "Acceso denegado. Este panel es exclusivo para administradores.",
          );
          setLoading(false);
          return;
        }

        setAdminUid(firebaseUser.uid);
        fetchPendingDoctors(firebaseUser.uid);
      } catch (err: any) {
        setError(err.message || "Error al validar los permisos.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const openConfirmationModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!adminUid || !selectedDoctor) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/health/admin/approve-doctor/${selectedDoctor.uid}?admin_uid=${adminUid}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        setError(`Error del servidor: ${errData.detail}`);
        setIsModalOpen(false);
        return;
      }

      setPendingDoctors(
        pendingDoctors.filter((doc) => doc.uid !== selectedDoctor.uid),
      );
      setToastMessage(
        `El Dr. ${selectedDoctor.name} ha sido aprobado con éxito.`,
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al procesar la aprobación.");
    } finally {
      setActionLoading(false);
      setIsModalOpen(false);
      setSelectedDoctor(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col items-center pt-8 sm:pt-16 px-4 sm:px-8 pb-20">
      {/* Toast Notificación Flotante de Alto Contraste */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-500 text-emerald-100 px-6 py-4 rounded-xl shadow-2xl transition-all">
          <span className="text-emerald-400 text-xl">🚀</span>
          <p className="text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      <div className="w-full max-w-7xl flex flex-col gap-8">
        {/* Encabezado Principal Sólido */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg">
          <div>
            <div className="inline-block px-3 py-1 bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-md mb-3">
              Módulo de Control Global
            </div>
            {/* CORREGIDO: text-black cambiado a text-white para legibilidad total */}
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Consola de Verificación{" "}
              <span className="text-indigo-400">RobertCare</span>
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-2">
              Validación manual de licencias médicas profesionales pendientes.
            </p>
          </div>

          <button
            onClick={() => adminUid && fetchPendingDoctors(adminUid)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            🔄 Actualizar Registro
          </button>
        </div>

        {/* Alertas de Error Críticas */}
        {error && (
          <div className="p-5 bg-rose-950 border border-rose-700 text-rose-200 rounded-xl text-sm font-bold flex items-center gap-3 shadow-md">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Tabla de Registros Pendientes */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Leyendo credenciales de seguridad
            </p>
          </div>
        ) : (
          <main className="bg-slate-900 border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
            {pendingDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-25 text-center">
                <h3 className="text-xl font-bold text-white pt-4">
                  Consola Vacía
                </h3>
                <p className="text-sm pb-4 text-slate-400 max-w-sm mt-2">
                  No se registran solicitudes de médicos esperando validación en
                  este momento.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <th className="p-5 pl-8">Profesional</th>
                      <th className="p-5">Especialidad</th>
                      <th className="p-5">Cédula Médica</th>
                      <th className="p-5">Edad / País</th>
                      <th className="p-5 pr-8 text-right">Acción Autorizada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {pendingDoctors.map((doc) => (
                      <tr
                        key={doc.uid}
                        className="hover:bg-slate-800 transition-colors"
                      >
                        {/* Nombre e Email */}
                        <td className="p-5 pl-8">
                          <div className="font-bold text-white text-base">
                            {doc.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            {doc.email}
                          </div>
                        </td>

                        {/* Especialidad */}
                        <td className="p-5">
                          <span className="inline-block bg-indigo-950 border border-indigo-700 text-indigo-300 px-3 py-1 rounded-md text-xs font-bold">
                            {doc.specialty}
                          </span>
                        </td>

                        {/* Cédula */}
                        <td className="p-5">
                          <span className="font-mono bg-slate-950 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600">
                            {doc.medical_license}
                          </span>
                        </td>

                        {/* Edad y País */}
                        <td className="p-5 text-slate-300 font-medium">
                          {doc.age} años •{" "}
                          <span className="text-white bg-slate-950 border border-slate-600 px-2 py-0.5 rounded text-xs font-mono font-bold uppercase">
                            {doc.countryCode || "MX"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-5 pr-8 text-right">
                          <button
                            onClick={() => openConfirmationModal(doc)}
                            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md active:scale-95 cursor-pointer"
                          >
                            ✓ Autorizar Alta
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

      {/* Modal de Confirmación Clínico */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 bg-slate-950 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-600 flex items-center justify-center text-amber-400 font-bold text-sm">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-white">
                Firma de Aprobación Requerida
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                ¿Estás seguro de otorgar credenciales completas al{" "}
                <strong className="text-white font-black">
                  Dr. {selectedDoctor.name}
                </strong>
                ? Este cambio modificará permanentemente su rol en la base de
                datos central.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-600 text-xs text-slate-300 space-y-2 font-mono">
                <div>
                  <span className="text-indigo-400 font-bold">RAMA:</span>{" "}
                  {selectedDoctor.specialty}
                </div>
                <div>
                  <span className="text-indigo-400 font-bold">ID_MED:</span>{" "}
                  {selectedDoctor.medical_license}
                </div>
                <div>
                  <span className="text-indigo-400 font-bold">MAIL:</span>{" "}
                  {selectedDoctor.email}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-600"
              >
                Declinar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
                className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Firmando Alta..." : "Confirmar y Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
