from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from . import schemas
from .firebase_client import get_db


def _db() -> Any:
    """Return initialized Firestore client or raise helpful error."""
    db = get_db()
    if db is None:
        raise RuntimeError(
            "Firestore client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or call init_firebase()."
        )
    return db


def _normalize_datetime(value: Any) -> Any:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return value



def create_user_endpoint(credentials):
    try:
        from src.health_math.services import _db
        db = _db()
        
        doc_id = credentials.email.strip().lower()
        
        # 1. Algoritmo Matemático: Cálculo de Tasa Metabólica Basal (TMB)
        peso = credentials.weight
        altura = credentials.height
        edad = credentials.age
        genero = credentials.gender.lower()
        
        if genero == "male":
            tmb = (10 * peso) + (6.25 * altura) - (5 * edad) + 5
        else:
            tmb = (10 * peso) + (6.25 * altura) - (5 * edad) - 161
            
        # 2. Multiplicadores de Actividad Física (Harris-Benedict / Mifflin)
        factores_actividad = {
            "sedentary": 1.2,      # Oficina, poco o nada de ejercicio
            "light": 1.375,     # Ejercicio ligero 1-3 días a la semana
            "moderate": 1.55,    # Ejercicio moderado 3-5 días a la semana
            "active": 1.725      # Ejercicio intenso 6-7 días a la semana
        }
        
        nivel = credentials.activityLevel.lower()
        factor = factores_actividad.get(nivel, 1.2)
        
        # Gasto Energético Total Diario (Calorías de mantenimiento)
        getd = tmb * factor
        
        # Índice de Masa Corporal (IMC) básico de referencia
        imc = peso / ((altura / 100) ** 2)

        # 3. Guardamos todo en Firestore de forma estructurada
        user_data = {
            "uid": doc_id,
            "name": credentials.name,
            "email": doc_id,
            "age": edad,
            "countryCode": credentials.countryCode,
            "hashedPassword": credentials.hashedPassword,
            
            # Datos crudos ingresados
            "weight": peso,
            "height": altura,
            "gender": genero,
            "activityLevel": nivel,
            
            # Métricas médicas calculadas por la API
            "tmb_kcal": round(tmb, 2),
            "getd_kcal": round(getd, 2),
            "imc": round(imc, 2),
            "createdAt": datetime.now(timezone.utc)
        }
        
        db.collection("users").document(doc_id).set(user_data)
        
        # Retornamos el payload para que Next.js pueda consumirlo
        return user_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_login(credentials: schemas.LoginRequest):
    from src.health_math.services import _db
    db = _db()
    
    doc_id = credentials.email.strip().lower()
    user_ref = db.collection("users").document(doc_id).get()
    
    if not user_ref.exists:
        raise HTTPException(status_code=404, detail="El usuario no está registrado.")
        
    user_data = user_ref.to_dict()
    
    # Validación simple original mediante operador de igualdad directa
    if credentials.password != user_data.get("hashedPassword"):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
        
    return {
        "status": "success",
        "user": {
            "uid": user_data.get("uid"),
            "email": user_data.get("email"),
            "name": user_data.get("name")
        }
    }


def list_users() -> List[schemas.UserRead]:
    db = _db()
    docs = db.collection("users").stream()
    results: List[schemas.UserRead] = []
    for doc in docs:
        d = doc.to_dict()
        results.append(
            schemas.UserRead(
                uid=d.get("uid"),
                email=d.get("email"),
                age=d.get("age"),
                name=d.get("name"),
                countryCode=d.get("countryCode"),
                createdAt=_normalize_datetime(d.get("createdAt")),
            )
        )
    return results


def get_user_by_uid(uid: str):
    db = _db() # Tu función de conexión a Firestore
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El usuario con UID {uid} no fue encontrado en RobertCare."
        )

    # Convertimos el documento de Firestore en un diccionario de Python
    user_data = user_doc.to_dict() or {}
    
    historial_clinico = get_weight_history(uid)

    peso_actual = float(user_data.get("weight", 0.0))
    agua_recomendada_ml = round(peso_actual * 35) if peso_actual > 0 else 0
    
    # Retornamos los datos estructurados con fallbacks anti-errores
    return {
        "uid": user_data.get("uid", uid),
        "email": user_data.get("email", uid),
        "name": user_data.get("name", "Usuario"),
        "age": user_data.get("age", 0),
        "countryCode": user_data.get("countryCode"),
        
        # Nuevas variables fisiológicas
        "weight": user_data.get("weight", 0.0),
        "height": user_data.get("height", 0.0),
        "gender": user_data.get("gender", "male"),
        "activityLevel": user_data.get("activityLevel", "sedentary"),
        
        # Métricas calculadas por los algoritmos
        "tmb_kcal": user_data.get("tmb_kcal", 0.0),
        "getd_kcal": user_data.get("getd_kcal", 0.0),
        "imc": user_data.get("imc", 0.0),
        
        "history": historial_clinico,
        "medical_history": user_data.get("medical_history", "Ninguna condición reportada."),

        "blood_type": user_data.get("blood_type", "No Especificado"),
        "smoking_habits": user_data.get("smoking_habits", "sedentary"),
        "alcohol_habits": user_data.get("alcohol_habits", "none"),
        "sleep_hours": user_data.get("sleep_hours", 0),
        
        "water_recommendation": agua_recomendada_ml
    }


def update_user_profile(uid: str, datos_nuevos: dict):
    try:
        db = _db()
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
            
        user_data = user_doc.to_dict() or {}
        
        # 1. Forzar la extracción y conversión limpia de los datos del formulario
        weight = float(datos_nuevos.get("weight", user_data.get("weight", 0.0)))
        height = float(datos_nuevos.get("height", user_data.get("height", 0.0)))
        age = int(datos_nuevos.get("age", user_data.get("age", 0)))
        gender = datos_nuevos.get("gender", user_data.get("gender", "male"))
        activity_level = datos_nuevos.get("activityLevel", user_data.get("activityLevel", "sedentary"))
        

        datos_nuevos["blood_type"] = datos_nuevos.get("blood_type") or user_data.get("blood_type", "No Especificado")
        datos_nuevos["smoking_habits"] = datos_nuevos.get("smoking_habits") or user_data.get("smoking_habits", "no_smoker")
        datos_nuevos["alcohol_habits"] = datos_nuevos.get("alcohol_habits") or user_data.get("alcohol_habits", "none") # 🌟 Paréntesis cerrado correctamente
        
        if "sleep_hours" in datos_nuevos and datos_nuevos["sleep_hours"] is not None:
            datos_nuevos["sleep_hours"] = int(datos_nuevos["sleep_hours"])
        else:
            datos_nuevos["sleep_hours"] = user_data.get("sleep_hours", 0)

        # 🧮 2. RECALCULAR EL EXPEDIENTE CLÍNICO COMPLETO
        if height > 0 and weight > 0:
            imc = weight / ((height / 100) ** 2)
            
            # Tasa Metabólica Basal
            if gender == "male":
                tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5
            else:
                tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161
                
            # Gasto Energético Total Diario
            factores = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
            getd = tmb * factores.get(activity_level, 1.2)
            
            # Inyectamos los números matemáticos redondeados al payload
            datos_nuevos["weight"] = round(weight, 1)
            datos_nuevos["height"] = round(height, 1)
            datos_nuevos["imc"] = round(imc, 1)
            datos_nuevos["tmb_kcal"] = round(tmb, 2)
            datos_nuevos["getd_kcal"] = round(getd, 2)
            
            # 📊 Guardamos en la subcolección histórica para mantener la gráfica viva
            ahora = datetime.now(timezone.utc)
            user_ref.collection("weight_history").add({
                "weight": round(weight, 1),
                "imc": round(imc, 1),
                "date": ahora.isoformat()
            })

        # 3. Guardar la actualización final con todos los campos nuevos en Firestore
        user_ref.update(datos_nuevos)
        return {"status": "success", "message": "Perfil clínico y estilo de vida actualizados."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
def create_policy(data: schemas.InsurancePolicyCreate) -> schemas.InsurancePolicyRead:
    db = _db()
    payload = data.model_dump()
    payload["createdAt"] = datetime.now(timezone.utc)
    db.collection("policies").add(payload)
    return schemas.InsurancePolicyRead(**data.model_dump())


def list_policies() -> List[schemas.InsurancePolicyRead]:
    db = _db()
    docs = db.collection("policies").stream()
    return [schemas.InsurancePolicyRead(**(doc.to_dict() or {})) for doc in docs]


def create_simulation(data: schemas.SimulationCreate) -> schemas.SimulationRead:
    db = _db()
    payload = data.model_dump()
    now = datetime.now(timezone.utc)
    payload["simulatedAt"] = now
    db.collection("simulations").add(payload)
    return schemas.SimulationRead(**{**data.model_dump(), "simulatedAt": now})


def list_simulations() -> List[schemas.SimulationRead]:
    db = _db()
    docs = db.collection("simulations").stream()
    results: List[schemas.SimulationRead] = []
    for doc in docs:
        d = doc.to_dict() or {}
        results.append(
            schemas.SimulationRead(
                **{
                    **d,
                    "simulatedAt": _normalize_datetime(d.get("simulatedAt")),
                }
            )
        )
    return results


def create_term(data: schemas.TermDefinitionCreate) -> schemas.TermDefinitionRead:
    db = _db()
    payload = data.model_dump()
    db.collection("terms").add(payload)
    return schemas.TermDefinitionRead(**payload)


def list_terms() -> List[schemas.TermDefinitionRead]:
    db = _db()
    docs = db.collection("terms").stream()
    return [schemas.TermDefinitionRead(**(doc.to_dict() or {})) for doc in docs]


def create_scenario(data: schemas.HealthConditionScenarioCreate) -> schemas.HealthConditionScenarioRead:
    db = _db()
    payload = data.model_dump()
    db.collection("scenarios").add(payload)
    return schemas.HealthConditionScenarioRead(**payload)


def list_scenarios() -> List[schemas.HealthConditionScenarioRead]:
    db = _db()
    docs = db.collection("scenarios").stream()
    return [schemas.HealthConditionScenarioRead(**(doc.to_dict() or {})) for doc in docs]

# 📂 Agregar a src/health_math/services.py
from datetime import datetime, timezone

def add_weight_log(uid: str, weight: float):
    try:
        db = _db()
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
            
        user_data = user_doc.to_dict() or {}
        height = user_data.get("height", 0)
        age = user_data.get("age", 0)
        gender = user_data.get("gender", "male")
        activity_level = user_data.get("activityLevel", "sedentary")
        
        if height == 0:
            raise HTTPException(status_code=400, detail="El usuario debe tener configurada su altura primero.")
            
        # 1. Recalcular métricas para esta lectura específica
        imc = weight / ((height / 100) ** 2)
        
        if gender == "male":
            tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5
        else:
            tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161
            
        factores = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
        getd = tmb * factores.get(activity_level, 1.2)
        
        ahora = datetime.now(timezone.utc)
        
        # 2. Guardar en la subcolección histórica de Firestore
        log_data = {
            "weight": round(weight, 1),
            "imc": round(imc, 1),
            "date": ahora.isoformat()
        }
        user_ref.collection("weight_history").add(log_data)
        
        # 3. Actualizar el perfil general con la última lectura conocida
        user_ref.update({
            "weight": round(weight, 1),
            "imc": round(imc, 1),
            "tmb_kcal": round(tmb, 2),
            "getd_kcal": round(getd, 2)
        })
        
        return {"status": "success", "message": "Lectura clínica registrada correctamente."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_weight_history(uid: str):
    """ Recupera el historial ordenado cronológicamente para la gráfica """
    db = _db()
    logs = db.collection("users").document(uid).collection("weight_history").order_by("date").get()
    
    history = []
    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for doc in logs:
        data = doc.to_dict()
        try:
            # Parsear la fecha para extraer el nombre sutil del mes
            dt = datetime.fromisoformat(data["date"])
            mes_str = meses[dt.month - 1]
        except:
            mes_str = "S/F"
            
        history.append({
            "mes": mes_str,
            "indice": data.get("imc")  # Graficaremos la evolución del IMC
        })
        
    # Si la base de datos está vacía, mandamos un punto inicial por defecto basado en su registro actual
    if not history:
        user_doc = db.collection("users").document(uid).get().to_dict() or {}
        if user_doc.get("imc"):
            history.append({"mes": "Actual", "indice": user_doc.get("imc")})
            
    return history