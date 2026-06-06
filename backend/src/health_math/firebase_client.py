from __future__ import annotations
import os
from typing import Optional
from firebase_admin import credentials, initialize_app, firestore

_db = None

# 1. Obtener la ruta absoluta de la carpeta donde vive este archivo 'firebase_client.py'
# Esto apuntará automáticamente a .../src/health_math/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Construir la ruta correcta hacia el archivo cred.json dentro de esta misma carpeta
DEFAULT_CRED_PATH = os.path.join(CURRENT_DIR, "cred.json")


def init_firebase(cred_path: Optional[str] = None):
    global _db
    if _db is None:
        # Si pasas una ruta personalizada y existe, úsala (útil para producción/Render)
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            initialize_app(cred)
        else:
            # Si no, usa la ruta dinámica que acabamos de calcular arriba
            if os.path.exists(DEFAULT_CRED_PATH):
                cred = credentials.Certificate(DEFAULT_CRED_PATH)
                initialize_app(cred)
            else:
                raise FileNotFoundError(
                    f"No se encontró el archivo de credenciales en: {DEFAULT_CRED_PATH}"
                )
        
        _db = firestore.client()
    return _db


def get_db():
    # Si _db no está inicializado, llamamos a init_firebase sin argumentos
    # para que tome la ruta dinámica por defecto.
    return _db or init_firebase()