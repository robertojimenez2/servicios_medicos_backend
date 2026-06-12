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
        { method: "PATCH", headers: { "Content-Type": "application/json" } },
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
      setError("Hubo un error al procesar la aprobación.");
    } finally {
      setActionLoading(false);
      setIsModalOpen(false);
      setSelectedDoctor(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Leyendo credenciales de seguridad...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-xl shadow-lg transition-all">
          <span className="text-emerald-500">🚀</span>
          <p className="text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Encabezado — mismo patrón que expediente */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Módulo de Control Global
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1.5">
            Consola de Verificación{" "}
            <span className="text-blue-700">RobertCare</span>
          </h1>
          <p className="text-sm text-slate-500">
            Validación manual de licencias médicas profesionales pendientes.
          </p>
        </div>
        <button
          onClick={() => adminUid && fetchPendingDoctors(adminUid)}
          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all self-start sm:self-auto"
        >
          🔄 Actualizar Registro
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* Tabla principal */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {pendingDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm font-semibold text-slate-500">
              Consola Vacía
            </p>
            <p className="text-xs mt-1 text-slate-400 max-w-xs">
              No se registran solicitudes de médicos esperando validación en
              este momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                  <th className="py-2.5 px-4">Profesional</th>
                  <th className="py-2.5 px-4">Especialidad</th>
                  <th className="py-2.5 px-4">Cédula Médica</th>
                  <th className="py-2.5 px-4">Edad / País</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDoctors.map((doc) => (
                  <tr
                    key={doc.uid}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Profesional */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700">{doc.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {doc.email}
                      </p>
                    </td>

                    {/* Especialidad */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                        {doc.specialty}
                      </span>
                    </td>

                    {/* Cédula */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {doc.medical_license}
                      </span>
                    </td>

                    {/* Edad / País */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700">
                        {doc.age} años
                      </p>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono uppercase">
                        {doc.countryCode || "MX"}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openConfirmationModal(doc)}
                        className="inline-block px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
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

      {/* Modal de confirmación */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-sm">
                ⚠️
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  Firma de Aprobación
                </span>
                <h3 className="text-base font-black text-slate-800 mt-0.5">
                  Confirmar Alta Médica
                </h3>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                ¿Estás seguro de otorgar credenciales completas al{" "}
                <strong className="text-slate-800 font-black">
                  Dr. {selectedDoctor.name}
                </strong>
                ? Este cambio modificará permanentemente su rol en la base de
                datos central.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">
                    Especialidad
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedDoctor.specialty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">
                    Cédula
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedDoctor.medical_license}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">
                    Correo
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedDoctor.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDoctor(null);
                }}
                className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Declinar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
                className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/60 rounded-xl transition-colors shadow-sm"
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
