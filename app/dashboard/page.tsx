"use client";

import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

interface PerfilMedico {
  email: string;
  age: number;
  countryCode: string;
}

export default function DashboardInicio() {
  const { user } = useAuth();
  const [datosMedicos, setDatosMedicos] = useState<PerfilMedico | null>(null);
  const [loadingAPI, setLoadingAPI] = useState(true);

  useEffect(() => {
    async function fetchPerfil() {
      // 🔑 Accedemos al UID único que Firebase le asignó al usuario en el navegador
      if (!user?.uid) return;

      try {
        // 📡 Consultamos a tu backend en Render usando el UID exacto
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/health/users/${user.uid}`,
        );

        if (response.ok) {
          const data = await response.json();
          setDatosMedicos(data); // Guardamos la edad, país, etc. en el estado de React
        } else {
          console.error("El backend no encontró este UID.");
        }
      } catch (error) {
        console.error("Error de red o servidor consultando FastAPI:", error);
      } finally {
        setLoadingAPI(false);
      }
    }

    fetchPerfil();
  }, [user]); // Se ejecuta en cuanto el Contexto Global detecta al usuario logueado4

  return (
    <div className="space-y-6">
      {/* Encabezado Dinámico */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">¡Hola de nuevo!</h2>
        <p className="text-slate-500 text-sm">
          Este es el estado actual de tu expediente en RobertCare.
        </p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tarjeta 1: Información de Perfil proveniente del Backend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">
                👤
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                Verificado
              </span>
            </div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Datos Clínicos
            </h3>
            {loadingAPI ? (
              <p className="text-slate-400 text-sm animate-pulse mt-2">
                Sincronizando con FastAPI...
              </p>
            ) : datosMedicos ? (
              <div className="mt-2 space-y-1">
                <p className="text-xl font-bold text-slate-800">
                  {datosMedicos.age} años
                </p>
                <p className="text-xs text-slate-500">
                  Residencia: {datosMedicos.countryCode || "No especificado"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-600 mt-2">
                No se encontraron datos en el servidor.
              </p>
            )}
          </div>
        </div>

        {/* Tarjeta 2: Marcador de Posición para futuras lógicas (ej. Ritmo Cardíaco) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg text-lg">
              ❤️
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              Sin conectar
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Ritmo Cardíaco
          </h3>
          <p className="text-xl font-bold text-slate-400 mt-2">-- bpm</p>
          <p className="text-xs text-slate-400 mt-1">
            Conecta un dispositivo médico
          </p>
        </div>

        {/* Tarjeta 3: Marcador de Posición para futuras lógicas (ej. Cálculos Matemáticos de Salud) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-green-50 text-green-600 rounded-lg text-lg">
              🧮
            </span>
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
              Módulo Activo
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Índice de Salud Math
          </h3>
          <p className="text-xl font-bold text-slate-800 mt-2">Listo</p>
          <p className="text-xs text-slate-500 mt-1">
            Algoritmos de `health_math` operativos
          </p>
        </div>
      </div>
    </div>
  );
}
