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

def list_users(role: Optional[str] = None) -> List[schemas.UserRead]:
    """
    Recupera los expedientes médicos de Firestore mapeando el 100% de los campos
    definidos en el esquema UserRead real para el uso del Profesional de la Salud.
    """
    try:
        db = _db()
        ref = db.collection("users")
        
        # Filtrado eficiente desde la base de datos si se solicita un rol específico
        if role:
            docs = ref.where("role", "==", role).stream()
            
        else:
            docs = ref.stream()
            
        results: List[schemas.UserRead] = []
        for doc in docs:
            d = doc.to_dict() or {}
            uid_val = d.get("uid") or doc.id
            
            # 🪵 Mapeo explícito y seguro para tu esquema UserRead
            results.append(
                schemas.UserRead(
                    role=d.get("role", "patient"),
                    uid=uid_val,
                    email=d.get("email") or "",
                    name=d.get("name", "Usuario sin nombre"),
                    age=d.get("age", 0),
                    countryCode=d.get("countryCode"),
                    
                    # 🏥 Hábitos e Información Básica
                    blood_type=d.get("blood_type"),
                    smoking_habits=d.get("smoking_habits"),
                    alcohol_habits=d.get("alcohol_habits"),
                    sleep_hours=d.get("sleep_hours"),
                    
                    # 🧮 Índices Metabólicos Calculados
                    tmb_kcal=d.get("tmb_kcal"),
                    getd_kcal=d.get("getd_kcal"),
                    imc=d.get("imc"),
                    
                    # 📈 Composición Corporal Básica
                    weight=float(d.get("weight", 0.0)),
                    height=float(d.get("height", 0.0)),
                    gender=d.get("gender", "male"),
                    activityLevel=d.get("activityLevel", "sedentary"),
                    speciality=d.get("speciality", "Nutricion"),
                    
                    # 📝 Historiales y Comentarios Estructurados
                    medical_comments=d.get("medical_comments"),
                    history=d.get("history"),
                    medical_history=d.get("medical_history"),
                    
                    # 🧪 Recomendaciones y Signos Vitales Avanzados
                    water_recommendation=d.get("water_recommendation"),
                    systolic_bp=d.get("systolic_bp"),
                    diastolic_bp=d.get("diastolic_bp"),
                    heart_rate=d.get("heart_rate"),
                    oxygen_saturation=d.get("oxygen_saturation"),
                    temperature=d.get("temperature"),
                
                    
                    # ⏳ Fechas de Control
                    date=d.get("date"),
                    timestamp=d.get("timestamp")
                )
            )
        return results

    except Exception as e:
        import traceback
        print("\n" + "🚨" * 20)
        print("❌ ERROR AL MAPEAR EXPEDIENTES EN LIST_USERS:")
        traceback.print_exc()
        print("🚨" * 20 + "\n")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno al procesar los expedientes médicos: {str(e)}"
        )

def get_user_by_uid(uid: str):
    db = _db()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El usuario con UID {uid} no fue encontrado en RobertCare."
        )

    user_data = user_doc.to_dict() or {}
    
    # 📊 1. LEER HISTORIAL DE PESO (Lo que ya teníamos)
    history_query = user_ref.collection("weight_history").order_by("date").stream()
    historial_clinico = []
    for h_doc in history_query:
        h_data = h_doc.to_dict() or {}
        historial_clinico.append({
            "weight": float(h_data.get("weight", user_data.get("weight", 0.0))),
            "indice": float(h_data.get("imc") or h_data.get("indice") or 0.0),
            "date": str(h_data.get("date") or h_doc.id)
        })

    # 🩺 2. NUEVO: LEER SUBCOLECCIÓN DE COMENTARIOS MÉDICOS
    # Los traemos ordenados del más reciente al más antiguo
    comments_query = user_ref.collection("medical_comments").order_by("timestamp", direction="DESCENDING").stream()
    lista_comentarios = []
    for c_doc in comments_query:
        c_data = c_doc.to_dict() or {}
        lista_comentarios.append({
            "id": c_doc.id,
            "comment": c_data.get("comment", ""),
            "doctor_name": c_data.get("doctor_name", "Sistema RobertCare"),
            "category": c_data.get("category", "general"),
            "date": c_data.get("date", ""),
            "timestamp": c_data.get("timestamp", "")
        })



    peso_actual = float(user_data.get("weight", 0.0))
    agua_recomendada_ml = round(peso_actual * 35) if peso_actual > 0 else 0
    
    return {
        "uid": user_data.get("uid", uid),
        "email": user_data.get("email", uid),
        "name": user_data.get("name", "Usuario"),
        "role": user_data.get("role", "patient"),
        "age": user_data.get("age", 0),
        "countryCode": user_data.get("countryCode"),
        "weight": peso_actual,
        "height": user_data.get("height", 0.0),
        "gender": user_data.get("gender", "male"),
        "activityLevel": user_data.get("activityLevel", "sedentary"),
        "tmb_kcal": user_data.get("tmb_kcal", 0.0),
        "getd_kcal": user_data.get("getd_kcal", 0.0),
        "imc": user_data.get("imc", 0.0),
        "specialty": user_data.get("specialty"),
        
        "history": historial_clinico,
        "medical_comments": lista_comentarios,  # 🎯 Inyectamos los comentarios aquí
        
        "medical_history": user_data.get("medical_history", "Ninguna condición reportada."),
        "blood_type": user_data.get("blood_type", "No Especificado"),
        "smoking_habits": user_data.get("smoking_habits", "no_smoker"),
        "alcohol_habits": user_data.get("alcohol_habits", "none"),
        "sleep_hours": user_data.get("sleep_hours", 0),
        "water_recommendation": user_data.get("water_recommendation", agua_recomendada_ml),
        "systolic_bp": user_data.get("systolic_bp", None),
        "diastolic_bp": user_data.get("diastolic_bp", None),
        "heart_rate": user_data.get("heart_rate", None),
        "oxygen_saturation": user_data.get("oxygen_saturation", None),
        "temperature": user_data.get("temperature", None),
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
        
        # Estilo de vida
        datos_nuevos["blood_type"] = datos_nuevos.get("blood_type") or user_data.get("blood_type", "No Especificado")
        datos_nuevos["smoking_habits"] = datos_nuevos.get("smoking_habits") or user_data.get("smoking_habits", "no_smoker")
        datos_nuevos["alcohol_habits"] = datos_nuevos.get("alcohol_habits") or user_data.get("alcohol_habits", "none")
        
        if "sleep_hours" in datos_nuevos and datos_nuevos["sleep_hours"] is not None:
            datos_nuevos["sleep_hours"] = int(datos_nuevos["sleep_hours"])
        else:
            datos_nuevos["sleep_hours"] = user_data.get("sleep_hours", 0)

        # 2. RECALCULAR EL EXPEDIENTE CLÍNICO COMPLETO
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

            # 💧 Agua (Cálculo corregido en mililitros puros)
            agua_recomendada = round(weight * 35)
            if activity_level == "moderate": 
                agua_recomendada += 500  # +500 ml
            elif activity_level == "active":
                agua_recomendada += 800  # +800 ml
            
            # Inyectamos los números matemáticos redondeados al payload
            datos_nuevos["weight"] = round(weight, 1)
            datos_nuevos["height"] = round(height, 1)
            datos_nuevos["imc"] = round(imc, 1)
            datos_nuevos["tmb_kcal"] = round(tmb, 2)
            datos_nuevos["getd_kcal"] = round(getd, 2)
            datos_nuevos["water_recommendation"] = round(agua_recomendada, 2)
            
            # 📊 HISTORIAL DIARIO DE PESO (Consolidado por ID de tipo YYYY-MM-DD)
            ahora = datetime.now(timezone.utc)
            doc_id_hoy = ahora.strftime("%Y-%m-%d")
            
            user_ref.collection("weight_history").document(doc_id_hoy).set({
                "weight": round(weight, 1),
                "imc": round(imc, 1),
                "date": doc_id_hoy,
                "timestamp": ahora.isoformat()
            }, merge=True)

        # 🩺 SANITIZACIÓN DE SIGNOS VITALES 
        for campo_int in ["systolic_bp", "diastolic_bp", "heart_rate", "oxygen_saturation"]:
            if campo_int in datos_nuevos and datos_nuevos[campo_int] is not None and datos_nuevos[campo_int] != "":
                datos_nuevos[campo_int] = int(datos_nuevos[campo_int])
            else:
                datos_nuevos[campo_int] = user_data.get(campo_int, None)

        if "temperature" in datos_nuevos and datos_nuevos["temperature"] is not None and datos_nuevos["temperature"] != "":
            datos_nuevos["temperature"] = float(datos_nuevos["temperature"])
        else:
            datos_nuevos["temperature"] = user_data.get("temperature", None)

        # 🛡️ ESCUDO: Quitamos el historial si viene en el payload para no duplicarlo en la raíz
        if "history" in datos_nuevos:
            del datos_nuevos["history"]

        # 3. Guardar la actualización final en Firestore
        user_ref.update(datos_nuevos)
        return {"status": "success", "message": "Perfil clínico y estilo de vida actualizados."}
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO EN BACKEND: {str(e)}")
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


def add_medical_comment(uid: str, comentario_nuevo: dict, doctor_uid: str):
    try:
        db = _db()
        
        # 🛡️ 1. VALIDAR QUE EL DOCTOR EXISTE Y TIENE EL ROL CORRECTO
        doctor_ref = db.collection("users").document(doctor_uid).get()
        if not doctor_ref.exists:
            raise HTTPException(status_code=403, detail="Acceso denegado. El emisor no existe.")
            
        doctor_data = doctor_ref.to_dict() or {}
        if doctor_data.get("role") != "doctor":
            raise HTTPException(
                status_code=403, 
                detail="Acceso denegado. Solo médicos autorizados pueden añadir comentarios."
            )
        
        # 🔍 2. VERIFICAR QUE EL PACIENTE REALMENTE EXISTE
        user_ref = db.collection("users").document(uid) 
        if not user_ref.get().exists:
            raise HTTPException(status_code=404, detail="El paciente especificado no existe.")
            
        ahora = datetime.now(timezone.utc)
        
        # Formateamos el nombre del profesional con su especialidad
        nombre_profesional = f"Dr. {doctor_data.get('name')}"
        if doctor_data.get("specialty"):
            nombre_profesional += f" ({doctor_data.get('specialty')})"

        comment_payload = {
            "comment": comentario_nuevo.get("comment"),
            "doctor_name": nombre_profesional,
            "specialty": doctor_data.get("specialty", "Medicina General"),
            "category": comentario_nuevo.get("category", "general"),
            "date": ahora.strftime("%Y-%m-%d"),
            "timestamp": ahora.isoformat()
        }
        
        # Guardamos en la subcolección del paciente 'uid'
        doc_ref = user_ref.collection("medical_comments").add(comment_payload)
        return {
            "status": "success", 
            "message": "Comentario médico firmado y guardado con éxito.",
            "comment_id": doc_ref[1].id
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ ERROR EN CONTROL DE COMENTARIOS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
def create_doctor_profile(uid: str, datos_medico: dict):
    """
    Crea el perfil inicial de un médico en la colección 'users'
    con estatus 'pending_doctor' para validación previa.
    """
    try:
        db = _db()
        user_ref = db.collection("users").document(uid)
        
        if user_ref.get().exists:
            raise HTTPException(status_code=400, detail="El usuario ya existe.")
            
        # Armamos el documento del médico
        doctor_document = {
            "uid": uid,
            "email": datos_medico.get("email"),
            "name": datos_medico.get("name"),
            "age": int(datos_medico.get("age", 0)),
            "countryCode": datos_medico.get("countryCode"),
            "role": "pending_doctor", # 🛡️ Filtro de seguridad inicial
            "specialty": datos_medico.get("specialty"),
            "medical_license": datos_medico.get("medical_license"),
            
            # Campos médicos vacíos por defecto (los doctores no los necesitan, pero evitan errores de lectura)
            "history": [],
            "medical_comments": [],
            "weight": 0.0,
            "height": 0.0,
            "gender": datos_medico.get("gender", "male")
        }
        
        user_ref.set(doctor_document)
        return {"status": "success", "message": "Registro médico exitoso. Cuenta en espera de aprobación."}
        
    except Exception as e:
        print(f"❌ ERROR AL REGISTRAR MÉDICO: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

def approve_doctor_profile(uid: str, admin_uid: str):
    """
    Cambia el rol de un usuario de 'pending_doctor' a 'doctor'
    tras verificar que quien lo aprueba es un administrador real.
    """
    try:
        db = _db()
        
        # 🛡️ 1. SEGURIDAD: Verificar que quien aprueba sea Administrador
        admin_ref = db.collection("users").document(admin_uid).get()
        if not admin_ref.exists or admin_ref.to_dict().get("role") != "admin":
            raise HTTPException(
                status_code=403, 
                detail="Acceso denegado. Solo administradores pueden autorizar médicos."
            )
            
        # 🔍 2. Buscar al médico pendiente
        doctor_ref = db.collection("users").document(uid)
        doctor_doc = doctor_ref.get()
        
        if not doctor_doc.exists:
            raise HTTPException(status_code=404, detail="El médico especificado no existe.")
            
        doctor_data = doctor_doc.to_dict() or {}
        
        # Guardar consistencia: Evitar procesar si ya está aprobado o si es un paciente
        if doctor_data.get("role") != "pending_doctor":
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede aprobar. El usuario actual tiene el rol: {doctor_data.get('role')}"
            )
            
        # 🎯 3. ACTUALIZAR EL ROL
        doctor_ref.update({"role": "doctor"})
        
        return {
            "status": "success",
            "message": f"El Dr. {doctor_data.get('name')} ha sido aprobado con éxito."
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ ERROR EN APROBACIÓN DE MÉDICO: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
def get_pending_doctors(admin_uid: str):
    db = _db()
    
    print(f"🔍 Verificando administrador con UID: {admin_uid}") # Log en tu consola de Python
    
    try:
        # 🛡️ 1. Intentar leer el documento del Admin
        admin_ref = db.collection("users").document(admin_uid).get()
        
        if not admin_ref.exists:
            print(f"❌ Error: El UID {admin_uid} no existe en la colección 'users' de Firestore.")
            raise HTTPException(
                status_code=403, 
                detail="El usuario no está registrado como administrador en el sistema."
            )
            
        admin_data = admin_ref.to_dict() or {}
        if admin_data.get("role") != "admin":
            print(f"❌ Error: El usuario existe pero su rol es '{admin_data.get('role')}', no 'admin'.")
            raise HTTPException(
                status_code=403, 
                detail="Acceso denegado. No tienes rol de administrador."
            )

        # 🔍 2. Si es admin real, traer los médicos pendientes
        query = db.collection("users").where("role", "==", "pending_doctor").stream()
        
        doctors_list = []
        for doc in query:
            data = doc.to_dict() or {}
            doctors_list.append({
                "uid": data.get("uid", doc.id),
                "name": data.get("name", "Médico sin nombre"),
                "email": data.get("email", ""),
                "specialty": data.get("specialty", "General"),
                "medical_license": data.get("medical_license", ""),
                "age": data.get("age", 0),
                "countryCode": data.get("countryCode", "MX")
            })
            
        return doctors_list

    except Exception as e:
        print(f"💥 Error crítico en Firestore: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno en Firestore: {str(e)}")