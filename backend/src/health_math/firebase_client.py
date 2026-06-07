import os
import json
from firebase_admin import credentials, initialize_app, _apps, firestore

# Variable global para almacenar el cliente de la base de datos
db = None

if not _apps:
    # 1. Intentamos obtener el JSON directo desde la variable de entorno de Render
    env_creds = os.getenv("FIREBASE_CREDENTIALS")
    
    if env_creds:
        cred_dict = json.loads(env_creds)
        cred = credentials.Certificate(cred_dict)
        print("🔥 Firebase inicializado con éxito en Render.")
    else:
        # 2. Desarrollo Local: buscamos el archivo físico 'cred.json'
        from pathlib import Path
        CURRENT_DIR = Path(__file__).parent
        DEFAULT_CRED_PATH = os.path.join(CURRENT_DIR, "cred.json")
        
        if os.path.exists(DEFAULT_CRED_PATH):
            cred = credentials.Certificate(DEFAULT_CRED_PATH)
            print("💻 Firebase inicializado localmente usando cred.json.")
        else:
            raise FileNotFoundError(f"No se encontró la variable FIREBASE_CREDENTIALS ni el archivo local en {DEFAULT_CRED_PATH}")

    # Inicialización oficial de Firebase Admin
    initialize_app(cred)

# 🚀 LA SOLUCIÓN: Creamos la función 'get_db' que tu router está intentando importar
def get_db():
    """
    Retorna la instancia del cliente de Firestore Database
    para que los servicios puedan hacer consultas.
    """
    return firestore.client()