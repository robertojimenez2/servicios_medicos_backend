from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Agrega aquí la URL de tu Localhost (para pruebas) y la URL que Render le dio a tu FRONTEND
origins = [
    "http://localhost:3000",
    "https://tu-frontend-robertcare.onrender.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # En desarrollo puedes usar ["*"] si deseas abrirlo a todos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def main():
    print("Hello from backend!")


if __name__ == "__main__":
    main()
