"use client";

import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import GraficaSalud from "./GraficaSalud";
import Link from "next/link";

// 📂 En tu app/dashboard/page.tsx actualiza la interfaz:
interface PerfilMedico {
  email: string;
  age: number;
  countryCode: string;
  weight: number;
  height: number;
  tmb_kcal: number; // 🎯 Traído desde FastAPI
  getd_kcal: number; // 🎯 Traído desde FastAPI
  imc: number; // 🎯 Traído desde FastAPI
  history: Array<{ mes: string; indice: number }>; // 🎯 Agregado
  medical_history: "";
}

export default function DashboardInicio() {
  const { user } = useAuth();
  const [datosMedicos, setDatosMedicos] = useState<PerfilMedico | null>(null);
  const [loadingAPI, setLoadingAPI] = useState(true);

  useEffect(() => {
    async function fetchPerfil() {
      // 🎯 FILTRO DE RESCATE: Si no hay uid por el formato del registro, usamos el email.
      // En tu Firestore el documento se guarda con el string del correo.
      const identificador = user?.uid || user?.email;

      if (!identificador) {
        console.log(
          "Esperando datos válidos del usuario en el contexto central...",
        );
        return;
      }

      try {
        setLoadingAPI(true);
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // encodeURIComponent protege la petición en caso de que use la '@' del correo
        const urlFinal = `${baseUrl}/health/users/${encodeURIComponent(identificador)}`;

        console.log(`📡 Dashboard consultando FastAPI en: ${urlFinal}`);

        const response = await fetch(urlFinal, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos del perfil cargados:", data);
          setDatosMedicos(data);
        } else {
          console.error(
            `El backend respondió con un error: ${response.status}`,
          );
          setDatosMedicos(null);
        }
      } catch (error) {
        console.error("Error de red o servidor consultando FastAPI:", error);
        setDatosMedicos(null);
      } finally {
        setLoadingAPI(false);
      }
    }

    fetchPerfil();
  }, [user, user?.uid, user?.email]); // Escucha cambios profundos en las propiedades del usuario

  return (
    <div className="space-y-6">
      {/* Encabezado Dinámico */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          ¡Hola de nuevo! {user?.name || "Usuario"}
        </h2>
        <div className="flex gap-4 items-center mt-1">
          <p className="text-slate-500 text-sm">
            Este es el estado de tu expediente clínico digital.
          </p>
          {/* 🎯 LINK HACIA LA NUEVA PÁGINA */}
          <Link
            href="/dashboard/perfil"
            className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
          >
            Editar Perfil ⚙️
          </Link>
        </div>
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
              <div className="mt-2 space-y-2">
                <p className="text-xl font-bold text-slate-800">
                  {datosMedicos.getd_kcal} kcal/día
                </p>
                <p className="text-xs text-slate-500">
                  Metabolismo Base: {datosMedicos.tmb_kcal} kcal | IMC:{" "}
                  {datosMedicos.imc}
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-600 mt-2">
                No se encontraron datos en el servidor.
              </p>
            )}
          </div>
        </div>

        {/* Tarjeta 2: Marcador de Posición para futuras lógicas */}
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

        {/* Tarjeta 3: Marcador de Posición para futuras lógicas */}
        {/* 🧮 Tarjeta 3: Módulo de Salud Math */}
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

          {loadingAPI ? (
            <p className="text-slate-400 text-sm animate-pulse mt-2">
              Sincronizando con FastAPI...
            </p>
          ) : datosMedicos ? (
            <div className="mt-2 space-y-2">
              {/* 🎯 Imprime el gasto diario si existe, de lo contrario un mensaje */}
              <p className="text-xl font-bold text-slate-800">
                {datosMedicos.getd_kcal
                  ? `${datosMedicos.getd_kcal} kcal/día`
                  : "Faltan métricas"}
              </p>

              <div className="text-xs text-slate-500 space-y-0.5">
                <p>Metabolismo: {datosMedicos.tmb_kcal || 0} kcal</p>
                <p>IMC: {datosMedicos.imc || 0}</p>
                <p className="text-[10px] text-slate-400 italic">
                  Registrado como: {datosMedicos.weight || 0}kg /{" "}
                  {datosMedicos.height || 0}cm
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-600 mt-2">
              No se recibieron datos metabólicos.
            </p>
          )}
        </div>
      </div>
      <div className="w-full">
        <GraficaSalud data={datosMedicos?.history || []} />
      </div>
    </div>
  );
}
