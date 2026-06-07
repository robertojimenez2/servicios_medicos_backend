from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 🚀 IMPORTANTE: Importamos el router que tienes dentro de tu subcarpeta
from src.health_math.router import router as health_router

app = FastAPI(
    title="RobertCare API",
    description="Infraestructura y lógica de previsión de salud centralizada",
    version="1.0.0"
)

# 🌐 Configuración de CORS estricta y segura para producción y desarrollo local
origins = [
    "http://localhost:3000",
    "http://localhost:3000/",
    "https://tu-frontend-robertcare.onrender.com", 
    "https://tu-frontend-robertcare.onrender.com/", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔗 Inyectamos las rutas de tu subcarpeta en la aplicación principal de FastAPI
app.include_router(health_router)

# Endpoint raíz de diagnóstico (Para verificar rápidamente en Render si la API responde)
@app.get("/")
def health_check():
    return {
        "status": "online", 
        "module": "health_math",
        "message": "API de RobertCare operando de forma correcta"
    }

def main():
    import uvicorn
    # Corre el servidor local apuntando al archivo actual
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()