"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    countryCode: "",
    weight: "",
    height: "",
    gender: "male",
    activityLevel: "sedentary",
    medical_history: "",
    blood_type: "No Especificado",
    smoking_habits: "no_smoker",
    alcohol_habits: "none",
    sleep_hours: "",
  });

  // 1. Cargar los datos actuales del usuario al entrar a la página
  useEffect(() => {
    async function cargarDatosActuales() {
      if (!user?.uid) return;
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(
          `${baseUrl}/health/users/${encodeURIComponent(user.uid)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || "",
            age: data.age?.toString() || "",
            countryCode: data.countryCode || "",
            weight: data.weight?.toString() || "",
            height: data.height?.toString() || "",
            gender: data.gender || "male",
            activityLevel: data.activityLevel || "sedentary",
            medical_history: data.medical_history || "",
            blood_type: data.blood_type || "No Especificado",
            smoking_habits: data.smoking_habits || "no_smoker",
            alcohol_habits: data.alcohol_habits || "none",
            sleep_hours: data.sleep_hours?.toString() || "",
          });
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setErrorMsg("No se pudieron recuperar tus datos clínicos actuales.");
      } finally {
        setLoading(false);
      }
    }
    cargarDatosActuales();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  // 2. Enviar los datos editados a FastAPI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/health/users/${encodeURIComponent(user.uid)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            age: Number(formData.age),
            countryCode: formData.countryCode || null,
            weight: Number(formData.weight),
            height: Number(formData.height),
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            medical_history: formData.medical_history,
            blood_type: formData.blood_type || "No Especificado",
            smoking_habits: formData.smoking_habits || "no_smoker",
            alcohol_habits: formData.alcohol_habits || "none",
            sleep_hours: formData.sleep_hours?.toString() || "",
          }),
        },
      );

      if (!response.ok) throw new Error("Error al actualizar el expediente.");

      setSuccessMsg("¡Expediente recalculado y actualizado con éxito!");

      // Esperar 1.5 segundos para que el usuario lea el éxito y redirigir
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setErrorMsg("Hubo un problema al sincronizar con el servidor de salud.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Cargando expediente clínico...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Editar Perfil Clínico
          </h1>
          <p className="text-sm text-slate-500">
            Actualiza tus métricas. El sistema recalculará tus índices
            metabólicos automáticamente.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
        >
          Volver
        </Link>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-200">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-xl border border-emerald-200">
          ✅ {successMsg}
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4 text-slate-800 dark:text-slate-100"
      >
        {/* Nombre Completo */}
        <div className="space-y-1">
          <label
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            htmlFor="name"
          >
            Nombre Completo
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grid Fisiológico */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              htmlFor="age"
            >
              Edad
            </label>
            <input
              type="number"
              id="age"
              name="age"
              required
              min="1"
              max="120"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              htmlFor="countryCode"
            >
              Código País
            </label>
            <input
              type="text"
              id="countryCode"
              name="countryCode"
              required
              maxLength={3}
              placeholder="MX"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Grid Clínico (Peso y Altura) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              htmlFor="weight"
            >
              Peso (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              required
              step="0.1"
              min="10"
              value={formData.weight}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              htmlFor="height"
            >
              Altura (cm)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              required
              min="40"
              value={formData.height}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Género */}
        <div className="space-y-1">
          <label
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            htmlFor="gender"
          >
            Género Asignado al Nacer
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </div>

        {/* Nivel de actividad */}
        <div className="space-y-1">
          <label
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            htmlFor="activityLevel"
          >
            Nivel de Actividad Física
          </label>
          <select
            id="activityLevel"
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          >
            <option value="sedentary">
              Sedentario (Poco o nada de ejercicio)
            </option>
            <option value="light">Ligero (Ejercicio 1-3 días/semana)</option>
            <option value="moderate">
              Moderado (Ejercicio 3-5 días/semana)
            </option>
            <option value="active">Intenso (Ejercicio 6-7 días/semana)</option>
          </select>
        </div>
        {/* 🎯 NUEVO: Grid de Estilo de Vida y Tipo de Sangre */}
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Estilo de Vida y Datos Críticos
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Sangre */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                htmlFor="blood_type"
              >
                Grupo Sanguíneo y Rh
              </label>
              <select
                id="blood_type"
                name="blood_type"
                value={formData.blood_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="No Especificado">No Especificado</option>
                <option value="O Positivo (O+)">O Positivo (O+)</option>
                <option value="O Negativo (O-)">O Negativo (O-)</option>
                <option value="A Positivo (A+)">A Positivo (A+)</option>
                <option value="A Negativo (A-)">A Negativo (A-)</option>
                <option value="B Positivo (B+)">B Positivo (B+)</option>
                <option value="B Negativo (B-)">B Negativo (B-)</option>
                <option value="AB Positivo (AB+)">AB Positivo (AB+)</option>
                <option value="AB Negativo (AB-)">AB Negativo (AB-)</option>
              </select>
            </div>

            {/* Horas de Sueño */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                htmlFor="sleep_hours"
              >
                Horas de Sueño Diario
              </label>
              <input
                type="number"
                id="sleep_hours"
                name="sleep_hours"
                min="1"
                max="24"
                placeholder="Ej: 7"
                value={formData.sleep_hours}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tabaquismo */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                htmlFor="smoking_habits"
              >
                Índice de Tabaquismo
              </label>
              <select
                id="smoking_habits"
                name="smoking_habits"
                value={formData.smoking_habits}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="no_smoker">No fumador</option>
                <option value="occasional">Fumador Ocasional / Social</option>
                <option value="heavy">Fumador Activo / Crónico</option>
              </select>
            </div>

            {/* Alcoholismo */}
            <div className="space-y-1">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                htmlFor="alcohol_habits"
              >
                Consumo de Alcohol
              </label>
              <select
                id="alcohol_habits"
                name="alcohol_habits"
                value={formData.alcohol_habits}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="none">Abstemia total</option>
                <option value="social">Consumo Moderado / Social</option>
                <option value="frequent">Consumo Frecuente</option>
              </select>
            </div>
          </div>
        </div>
        {/*antecesdentes medicos*/}
        <div className="space-y-1">
          <label
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            htmlFor="medical_history"
          >
            Historial de Enfermedades y Alergias
          </label>
          <textarea
            id="medical_history"
            name="medical_history"
            rows={3}
            placeholder="Ej. Hipertensión controlada, Alergia a la penicilina, Asma infantil..."
            value={formData.medical_history}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <p className="text-[10px] text-slate-400 italic">
            Separa las condiciones por comas para una mejor lectura clínica.
          </p>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={saving}
          className="w-full mt-4 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800/60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving
            ? "Sincronizando Algoritmos..."
            : "Guardar y Recalcular Índices"}
        </button>
      </form>
    </div>
  );
}
