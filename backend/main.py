from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.health_math.router import router as health_router

app = FastAPI(
    title="RobertCare API",
    description="Infraestructura y lógica de previsión de salud centralizada",
    version="1.0.0"
)

# 🌐 Coloca aquí tus URLs REALES. (Verifica la URL exacta de tu frontend en tu panel de Render)
origins = [
    "http://localhost:3000",
    "http://localhost:3000/",
    "https://robertcare-front.onrender.com",     # 👈 Reemplaza con tu subdominio real de Render
    "https://robertcare-front.onrender.com/",    # 👈 Con y sin barra diagonal
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # 👈 CAMBIADO: Usamos tu lista explícita en lugar de ["*"]
    allow_credentials=True,      # 👈 RE-HABILITADO: Necesario para flujos con Next.js/Firebase
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)

@app.get("/")
def health_check():
    return {
        "status": "online", 
        "module": "health_math",
        "message": "API de RobertCare operando de forma correcta"
    }

def main():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()