"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { loginCentral } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    edad: "",
    countryCode: "",
    confirmPassword: "",
    weight: "",
    height: "",
    gender: "male",
    activityLevel: "sedentary",
  });

  // Modificado para soportar select e inputs comunes sin problemas de tipos
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { nombre, email, password, edad, countryCode, confirmPassword } =
      formData;

    if (activeTab === "register" && password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "register") {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        console.log(
          "Enviando datos médicos y de registro a FastAPI...",
          formData,
        );

        const response = await fetch(`${apiUrl}/health/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            hashedPassword: formData.password,
            name: formData.nombre,
            age: Number(formData.edad),
            countryCode: formData.countryCode || null,
            weight: Number(formData.weight),
            height: Number(formData.height),
            gender: formData.gender,
            activityLevel: formData.activityLevel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Detalle del 422 o error de FastAPI:", errorData);
          throw new Error(
            errorData.detail
              ? JSON.stringify(errorData.detail)
              : "Error en el formato de registro.",
          );
        }

        const data = await response.json();
        console.log("¡Usuario registrado con éxito!", data);

        if (data.email) {
          loginCentral({
            uid: data.uid || data.email,
            email: data.email,
            name: data.name,
            role: data.role || "patient",
          });
        }

        router.push("/dashboard");
        return;
      }

      if (activeTab === "login") {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const response = await fetch(`${apiUrl}/health/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) throw new Error("auth/user-not-found");
          if (response.status === 401) throw new Error("auth/wrong-password");
          throw new Error("server-error");
        }

        const data = await response.json();
        console.log("¡Logueado con éxito mediante FastAPI!", data);

        if (data.user) {
          // Asegúrate de que `data.user` contenga la propiedad `role` desde FastAPI
          loginCentral(data.user);
        }

        router.push("/dashboard");
        return;
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* NAVBAR */}
      <nav className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-black text-blue-800 dark:text-blue-400 tracking-tight"
          >
            RobertCare
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* CONTENEDOR */}
      <main className="grow flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] background-size:16px_16px opacity-60 pointer-events-none"></div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-xl p-8 relative z-10">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {activeTab === "login"
                ? "Bienvenido de vuelta"
                : "Crea tu cuenta"}
            </h1>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* SELECTOR TABS */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setActiveTab("login");
                setErrorMsg("");
              }}
              className={`py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                activeTab === "login"
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className={`py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                activeTab === "register"
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "register" && (
              <>
                {/* Nombre */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                    htmlFor="nombre"
                  >
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Robert Care"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Grid para Fisiología Básica */}
                <div className="grid grid-cols-2 gap-4">
                  {/* País */}
                  <div className="space-y-1">
                    <label
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      htmlFor="countryCode"
                    >
                      País
                    </label>
                    <input
                      type="text"
                      id="countryCode"
                      name="countryCode"
                      required
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      placeholder="MX"
                      maxLength={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Edad */}
                  <div className="space-y-1">
                    <label
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      htmlFor="edad"
                    >
                      Edad
                    </label>
                    <input
                      type="number"
                      id="edad"
                      name="edad"
                      required
                      value={formData.edad}
                      onChange={handleInputChange}
                      placeholder="20"
                      min={1}
                      max={120}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Grid para Métricas Clínicas (Peso y Altura) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Peso */}
                  <div className="space-y-1">
                    <label
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      htmlFor="weight"
                    >
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      required
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="70"
                      step="0.1"
                      min={10}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Altura */}
                  <div className="space-y-1">
                    <label
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      htmlFor="height"
                    >
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      required
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="175"
                      min={50}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Género Biológico */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                    htmlFor="gender"
                  >
                    Sexo
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>

                {/* Actividad Física */}
                <div className="space-y-1">
                  <label
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                    htmlFor="activityLevel"
                  >
                    Nivel de Actividad Física
                  </label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sedentary">
                      Sedentario (Poco o nada de ejercicio)
                    </option>
                    <option value="light">
                      Ligero (Ejercicio 1-3 días/semana)
                    </option>
                    <option value="moderate">
                      Moderado (Ejercicio 3-5 días/semana)
                    </option>
                    <option value="active">
                      Intenso (Ejercicio 6-7 días/semana)
                    </option>
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                htmlFor="email"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activeTab === "register" && (
              <div className="space-y-1">
                <label
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                  htmlFor="confirmPassword"
                >
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sincronizando...
                </>
              ) : activeTab === "login" ? (
                "Ingresar al Sistema"
              ) : (
                "Crear mi Cuenta"
              )}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿Eres Profesional de la Salúd?{" "}
              <Link
                href="/auth/login" // 👈 Cambia esto por la ruta real de tu login de pacientes
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        © 2026 RobertCare. Infraestructura de datos de salud unificada.
      </footer>
    </div>
  );
}
