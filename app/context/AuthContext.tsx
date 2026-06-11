"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CustomUser {
  uid: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  loginCentral: (userData: CustomUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginCentral: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedSession = localStorage.getItem("userSession");
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        console.error("Error parseando la sesión guardada", e);
        localStorage.removeItem("userSession");
      }
    }
    setLoading(false); // Listo, la app ya sabe si el usuario está validado
  }, []);

  // Función para inyectar el usuario en el estado global inmediatamente al hacer login
  const loginCentral = (userData: CustomUser) => {
    setUser(userData);
    localStorage.setItem("userSession", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userSession");
    router.push("/auth"); // O la ruta de tu login
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginCentral, logout }}>
      {!loading ? (
        children
      ) : (
        <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          Cargando RobertCare...
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
