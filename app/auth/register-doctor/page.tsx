"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase.config";

export default function RegisterDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado del formulario mapeado 1:1 con el Pydantic DoctorCreate
  const [formData, setFormData] = useState({
    email: "",
    password: "", // Se mapeará como hashedPassword hacia tu API
    name: "",
    age: "",
    specialty: "",
    medical_license: "",
    countryCode: "MX", // Por defecto o dinámico
    gender: "male",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const firebaseUid = userCredential.user.uid; // 🎯 ID Limpio (Ej: "Wq83jD...")

      const payload = {
        email: formData.email,
        hashedPassword: formData.password,
        name: formData.name,
        age: parseInt(formData.age, 10) || 0,
        countryCode: formData.countryCode || "string", // Usa "string" o tu código de país
        role: "pending_doctor",
        specialty: formData.specialty,
        medical_license: formData.medical_license,
        weight: 0,
        height: 0,
        gender: formData.gender || "male",
      };

      // Asegúrate de que las credenciales no vayan vacías para que no rompan el min_length
      if (!payload.specialty || !payload.medical_license) {
        setError("La especialidad y la licencia médica son obligatorias.");
        setLoading(false);
        return;
      }
      console.log(JSON.stringify(payload));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/health/auth/register-doctor/${firebaseUid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Error al sincronizar el perfil con el servidor.",
        );
      }

      setSuccess(
        "¡Registro exitoso! Tu cuenta está en espera de aprobación por el administrador.",
      );

      // Redirigir opcionalmente después de unos segundos
      setTimeout(() => {
        router.push("/auth/login");
      }, 4000);
    } catch (err: any) {
      setError(
        err.message || "Ocurrió un error inesperado durante el registro.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        {/* Encabezado */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            RobertCare <span className="text-blue-600">Pro</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Registro exclusivo para Profesionales de la Salud
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700">
            ✅ {success}
          </div>
        )}

        {/* Formulario */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dr. Alexander Fleming"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Edad
              </label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="35"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="doctor@robertcare.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <hr className="my-4 border-gray-200" />
          <p className="text-xs font-bold text-blue-600 tracking-wide uppercase mb-2">
            Credenciales Clínicas
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Especialidad Médica
            </label>
            <input
              type="text"
              name="specialty"
              required
              value={formData.specialty}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cardiólogo, Nutriólogo Clínico"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Cédula Profesional / Licencia
            </label>
            <input
              type="text"
              name="medical_license"
              required
              value={formData.medical_license}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 983742"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-6 py-3 px-4 rounded-lg text-white font-medium shadow transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {loading ? "Procesando Registro..." : "Solicitar Alta Médica"}
          </button>
        </form>
      </div>
    </div>
  );
}
