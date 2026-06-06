"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Hook de Next.js para redireccionar

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulación de consumo de API de FastAPI
    try {
      if (isLogin) {
        console.log("Enviando a FastAPI (/auth/token):", { email, password });
        // Aquí harás el fetch a tu backend
        // Al tener éxito, rediriges al Dashboard de Next.js:
        // router.push('/dashboard');
      } else {
        console.log("Enviando a FastAPI (/users/register):", {
          email,
          password,
          age,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">
          SanaPrevisión
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isLogin
            ? "Protege tu salud y tus finanzas desde hoy."
            : "Crea tu cuenta y simula tus escenarios financieros."}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Tu Edad
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej. 45"
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
                />
                <p className="mt-1 text-xs text-slate-500">
                  La usamos para calcular tus proyecciones actuariales.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? "Procesando..."
                  : isLogin
                    ? "Ingresar al Sistema"
                    : "Registrarme Gratis"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setAge("");
              }}
              className="text-sm font-medium text-green-700 hover:text-green-800 underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-1 cursor-pointer"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes una cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
