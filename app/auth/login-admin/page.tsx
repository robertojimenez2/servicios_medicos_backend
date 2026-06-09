"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// 🎯 Importamos las herramientas nativas del cliente de Firebase
import { auth } from "../../../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
import Navv from "@/app/components/Navv";

export default function AdminLoginPage() {
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
      // 🔑 1. Autenticación directa en Firebase Auth (Cliente)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password,
      );

      const firebaseUser = userCredential.user;
      console.log("¡Autenticado en Firebase con éxito! UID:", firebaseUser.uid);

      // 🔍 2. Consultar el rol real en tu base de datos mediante FastAPI
      // Usamos el endpoint que lee el documento del usuario por ID
      const response = await fetch(
        `${apiUrl}/health/users/${firebaseUser.uid}`,
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo verificar el perfil clínico en el servidor.",
        );
      }

      const userData = await response.json();

      // 🛡️ 3. VALIDACIÓN DE SEGURIDAD: Comprobar el rol de Administrador
      if (userData.role !== "admin") {
        // Si no es admin, lo deslogueamos inmediatamente para no dejar la sesión abierta
        await auth.signOut();
        throw new Error(
          "Acceso denegado. Esta cuenta no tiene privilegios de administrador.",
        );
      }

      // 💾 Guardamos la sesión en el localStorage para mantener consistencia
      localStorage.setItem("userSession", JSON.stringify(userData));

      // 🔀 4. Redirección al panel
      // router.push("/dashboard/admin");
      window.location.replace("/dashboard/admin");
    } catch (err: any) {
      console.error("Error en login de admin:", err);

      // Mapeo de errores nativos de Firebase para que sean amigables
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(err.message || "Ocurrió un error al intentar iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navv />{" "}
      <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-xl shadow-2xl border border-slate-800">
          {/* Encabezado */}
          <div className="text-center">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              Consola del Sistema (SDK)
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              RobertCare <span className="text-red-500">Admin</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Inicio de sesión directo mediante Firebase Client
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="bg-red-950/40 border-l-4 border-red-500 p-4 rounded text-sm text-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Formulario */}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                placeholder="admin@robertcare.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 px-4 rounded-lg text-white font-medium shadow-md transition ${
                loading
                  ? "bg-red-900/50 cursor-not-allowed text-slate-400"
                  : "bg-red-600 hover:bg-red-700 active:scale-[0.98]"
              }`}
            >
              {loading ? "Autenticando en Firebase..." : "Entrar a la Consola"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
