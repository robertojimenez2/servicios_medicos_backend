"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Pointer } from "lucide-react";
import Link from "next/link";
import Navv from "@/app/components/Navv";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 🔑 1. Autenticación directa en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password,
      );

      const firebaseUser = userCredential.user;
      console.log("¡Médico autenticado en Firebase! UID:", firebaseUser.uid);

      const response = await fetch(
        `${apiUrl}/health/users/${firebaseUser.uid}`,
      );

      if (!response.ok) {
        // Si falla la API, deslogueamos de Firebase para no dejar la sesión rota
        await auth.signOut();
        throw new Error(
          "No se pudo verificar tu perfil profesional en el servidor.",
        );
      }

      const userData = await response.json();

      // 🛡️ 3. VALIDACIÓN CRÍTICA DE ROL
      if (userData.role !== "doctor") {
        await auth.signOut(); // Deslogueo inmediato por seguridad

        if (userData.role === "pending_doctor") {
          throw new Error(
            "Tu cuenta está en revisión. El administrador debe aprobar tu cédula médica.",
          );
        } else {
          throw new Error(
            "Acceso deneg5ado. Esta cuenta no pertenece a un profesional de la salud.",
          );
        }
      }
      localStorage.setItem("userSession", JSON.stringify(userData));

      console.log("Redirigiendo al panel del médico...");

      router.refresh;
      // router.push("/dashboard/doctor");
      window.location.replace("/dashboard/doctor");
    } catch (err: any) {
      console.error("Error en el login de médico:", err);

      // Control de errores de Firebase Auth comunes
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("El correo o la contraseña son incorrectos.");
      } else {
        setError(
          err.message || "Ocurrió un error inesperado al intentar ingresar.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navv />
      <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-100 antialiased">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800">
          {/* Encabezado */}
          <div className="text-center">
            <span className="px-3 py-1 bg-indigo-500/10 text-white text-xs font-black rounded-md uppercase tracking-widest border border-indigo-500/20">
              Acceso Médico
            </span>
            <h2 className="mt-4 text-3xl font-black text-white tracking-tight">
              RobertCare <span className="text-indigo-400">Clinical</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Ingresa a tu consola de expedientes médicos
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-800 p-4 rounded-xl text-sm text-red-200 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Formulario */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Correo Institucional / Profesional
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                placeholder="dr.nombre@robertcare.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{}}
              className={`w-full mt-6 py-3 px-4 rounded-xl text-white font-black text-sm shadow-lg transition-all ${
                loading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-400 hover:bg-indigo-300 active:scale-[0.98]"
              }`}
            >
              {loading
                ? "Verificando Credenciales..."
                : "Iniciar Sesión Clínica"}
            </button>
          </form>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            ¿Quieres registrarte?{" "}
            <Link
              href="/auth/register-doctor/" // 👈 Cambia esto por la ruta real de tu login de pacientes
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition"
            >
              Da clic aqui
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
