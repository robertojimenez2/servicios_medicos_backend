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
    // 🎨 FONDO OSCURO ABSOLUTO (Fuerza legibilidad total en pantallas con bugs de color)
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans p-6 sm:p-10">
      {/* Toast Notificación Flotante */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center bg-emerald-500 text-slate-950 font-bold px-6 py-4 rounded-xl shadow-2xl animate-slideIn">
          <span className="mr-3 text-xl">🚀</span>
          <p className="text-sm">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Consola de Verificación{" "}
              <span className="text-indigo-400">RobertCare</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Validación manual de licencias médicas profesionales pendientes.
            </p>
          </div>
          <button
            onClick={() => adminUid && fetchPendingDoctors(adminUid)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-indigo-400 text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 hover:text-indigo-300 transition-all active:scale-[0.98]"
          >
            🔄 Actualizar Registro
          </button>
        </div>

        {/* Alertas de Error */}
        {error && (
          <div className="p-4 mb-6 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-sm font-semibold shadow-inner">
            ⚠️ Alerta del Sistema: {error}
          </div>
        )}

        {/* Contenedor Principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-sm font-bold text-slate-400">
              Leyendo base de datos de seguridad...
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {pendingDoctors.length === 0 ? (
              <div className="p-20 text-center bg-slate-900/50">
                <span className="text-5xl block mb-4">🛡️</span>
                <h3 className="text-xl font-black text-white">Consola Vacía</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  No se registran solicitudes de médicos esperando validación en
                  este momento.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800">
                      <th className="p-5">Profesional</th>
                      <th className="p-5">Especialidad</th>
                      <th className="p-5">Cédula Médica</th>
                      <th className="p-5">Edad / País</th>
                      <th className="p-5 text-right">Acción Autorizada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {pendingDoctors.map((doc) => (
                      <tr
                        key={doc.uid}
                        className="hover:bg-slate-950/50 transition-colors"
                      >
                        {/* Nombre del médico */}
                        <td className="p-5">
                          <div className="font-bold text-white text-base tracking-wide">
                            {doc.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {doc.email}
                          </div>
                        </td>
                        {/* Especialidad */}
                        <td className="p-5">
                          <span className="inline-flex items-center px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20">
                            {doc.specialty}
                          </span>
                        </td>
                        {/* Cédula */}
                        <td className="p-5">
                          <span className="font-mono bg-slate-950 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-800">
                            {doc.medical_license}
                          </span>
                        </td>
                        {/* Edad y País */}
                        <td className="p-5 text-slate-400 font-semibold">
                          {doc.age} años •{" "}
                          <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-xs uppercase font-black">
                            {doc.countryCode || "MX"}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td className="p-5 text-right">
                          <button
                            onClick={() => openConfirmationModal(doc)}
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.95]"
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
          </div>
        )}
      </div>

      {/* 👑 MODAL DE CONFIRMACIÓN CON ULTRA CONTRASTE */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 max-w-md w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transform transition-all p-1">
            {/* Cabecera */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-black text-lg">
                !
              </div>
              <h3 className="text-base font-bold text-white">
                Firma de Aprobación Requerida
              </h3>
            </div>

            {/* Cuerpo */}
            <div className="p-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                ¿Estás seguro de otorgar credenciales completas al{" "}
                <strong className="text-white">
                  Dr. {selectedDoctor.name}
                </strong>
                ? Este cambio modificará permanentemente su rol en la base de
                datos central.
              </p>

              <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
                <div>
                  <span className="text-indigo-400">RAMA:</span>{" "}
                  {selectedDoctor.specialty}
                </div>
                <div>
                  <span className="text-indigo-400">ID_MED:</span>{" "}
                  {selectedDoctor.medical_license}
                </div>
                <div>
                  <span className="text-indigo-400">MAIL:</span>{" "}
                  {selectedDoctor.email}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
              >
                Declinar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
                className="px-5 py-2.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg transition active:scale-[0.97] disabled:opacity-50"
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
