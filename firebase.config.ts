import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 1. Tus claves públicas del frontend de Firebase.
// Es una buena práctica usar variables de entorno (NEXT_PUBLIC_).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Inicializar Firebase de forma segura para evitar duplicidad en el hot-reload de Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 3. Exportar el módulo de autenticación listo para usar en tus componentes
export const auth = getAuth(app);
export default app;
