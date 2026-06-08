"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // 1. Al cargar, revisamos qué tema tenía guardado el usuario o si el HTML ya tiene la clase
    const savedTheme = localStorage.getItem("theme");
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme && document.documentElement.classList.contains("dark"));

    setTheme(isDark ? "dark" : "light");

    // 2. Sincronizamos los atributos estrictos con el CSS global apenas cargue
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      // Pasamos a Modo Día (Forzamos las clases y atributos 'light')
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");

      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      // Pasamos a Modo Noche (Forzamos las clases y atributos 'dark')
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");

      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      // Estilos del botón consistentes: Blanco en día, Oscuro/Ámbar en noche
      className="p-2 rounded-xl flex items-center justify-center w-10 h-10 transition-all duration-300 transform hover:scale-110 active:scale-95 border shadow-sm cursor-pointer relative z-50 bg-white border-slate-200 text-black dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? (
        // Icono de Sol (Modo Noche activo)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M12 6a6 6 0 100 12 6 6 0 000-12zM6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.03 1.05l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79zM17.24 19.16l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM20 11v2h3v-2h-3zM6.76 19.16l-1.79 1.79 1.79 1.79 1.79-1.79-1.79-1.79zM11 23h2v-3h-2v3z" />
        </svg>
      ) : (
        // Icono de Luna (Modo Día activo)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
