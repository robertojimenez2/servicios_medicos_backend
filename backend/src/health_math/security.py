# 📂 src/health_math/security.py
from passlib.context import CryptContext

# Configura passlib para usar bcrypt con un factor de trabajo (rounds) seguro
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Transforma la contraseña plana en un hash seguro con sal aleatoria.
    Se usa en el endpoint de REGISTRO.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara la contraseña que ingresa el usuario con el hash guardado en Firestore.
    Se usa en el endpoint de LOGIN.
    """
    return pwd_context.verify(plain_password, hashed_password)