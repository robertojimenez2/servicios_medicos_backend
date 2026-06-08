"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// 🎯 Definimos la estructura de cada punto del historial clínico
interface HistorialPunto {
  mes: string;
  indice: number; // Representa el IMC calculado cronológicamente
}

// 🎯 Definimos las propiedades que recibirá el componente desde el Dashboard
interface GraficaSaludProps {
  data: HistorialPunto[];
}

export default function GraficaSalud({ data }: GraficaSaludProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">
          Progreso del Índice Health Math Real
        </h3>
        <p className="text-xs text-slate-500">
          Evolución de tu Índice de Masa Corporal (IMC) en base a tus registros
          médicos en tiempo real.
        </p>
      </div>

      {/* Contenedor adaptativo anti-colapso */}
      <div className="w-full h-[240px] min-w-0">
        {/* Forzamos el height numérico fijo para mitigar bugs de re-renderizado en Recharts */}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data} // 🎯 Consumiendo los datos dinámicos del backend
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIndice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="mes"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              /* 🎯 Adaptabilidad automática al rango IMC real del paciente */
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                borderRadius: "8px",
                color: "#fff",
                border: "none",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="indice"
              name="Índice (IMC)"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorIndice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
