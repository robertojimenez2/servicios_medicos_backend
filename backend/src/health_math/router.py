from typing import Optional
import io
from fastapi import APIRouter, HTTPException, status, Query, Depends
from . import schemas, services
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/health", tags=["health_math"])


@router.post("/users", response_model=schemas.UserRead)
def create_user_endpoint(user: schemas.UserCreate):
    try:
        from src.health_math.services import _db
        db = _db()  
        
        doc_id = user.email.strip().lower()
        
        # Verificación inicial en Firestore
        if db.collection("users").document(doc_id).get().exists:
            raise HTTPException(status_code=400, detail="El usuario ya existe.")
            
        return services.create_user_endpoint(user)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print("\n" + "🚨" * 20)
        print("❌ DETALLE DEL ERROR REAL EN EL BACKEND:")
        traceback.print_exc()
        print("🚨" * 20 + "\n")
        
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=list[schemas.UserRead])
def get_users(role: Optional[str] = Query(None, description="Filtrar usuarios por rol")):
    """
    Retorna la lista de usuarios. Puedes usar ?role=patient para traer solo pacientes.
    """
    return services.list_users(role=role)


@router.post("/login") 
def get_login(credentials: schemas.LoginRequest): 
    return services.get_login(credentials)

@router.put("/users/{uid}")
def update_user(uid: str, payload: dict):
    """
    Actualiza los datos del usuario y recalcula instantáneamente sus índices de salud.
    """
    return services.update_user_profile(uid, payload)

@router.post("/users/{uid}/weight-log")
def log_user_weight(uid: str, payload: dict):
    """
    Registra una nueva lectura de peso para el historial del usuario.
    Payload esperado: {"weight": 72.5}
    """
    weight = payload.get("weight")
    if not weight:
        raise HTTPException(status_code=400, detail="El campo 'weight' es obligatorio.")
        
    return services.add_weight_log(uid, float(weight))


@router.get("/users/{uid}", response_model=schemas.UserRead)
def get_user_by_uid(uid: str):
    return services.get_user_by_uid(uid)


@router.post("/users/{uid}/comments", status_code=201)
def create_patient_comment(uid: str, payload: schemas.MedicalCommentCreate, doctor_uid):
    """
    Endpoint para registrar un comentario, diagnóstico o recomendación médica 
    dentro del expediente de un paciente específico.
    """
    # Pasamos el modelo convertido a diccionario de Python (.model_dump() en Pydantic v2)
    resultado = services.add_medical_comment(uid, payload.model_dump(), doctor_uid)
    return resultado

@router.post("/auth/register-doctor/{uid}", status_code=201)
def register_doctor(uid: str, payload: schemas.DoctorCreate):
    """
    Endpoint público para que los profesionales de la salud 
    soliciten la creación de su cuenta en RobertCare.
    """
    return services.create_doctor_profile(uid, payload.model_dump())



@router.patch("/admin/approve-doctor/{uid}", status_code=200)
def authorize_doctor(uid: str, admin_uid: str = Query(...)):
    """
    Endpoint administrativo para aprobar las credenciales de un médico.
    Mapeado para recibir admin_uid desde la URL (?admin_uid=...)
    """
    return services.approve_doctor_profile(uid, admin_uid)


@router.get("/admin/pending-doctors", status_code=200)
def list_pending_doctors(admin_uid: str = Query(...)):
    """
    Endpoint para que el Panel de Administración obtenga la lista de médicos por validar.
    Mapeado para recibir admin_uid desde la URL (?admin_uid=...)
    """
    return services.get_pending_doctors(admin_uid)

    doctor_uid: str = Field(..., description="UID único del médico en RobertCare")
    patient_id: str = Field(..., description="Email o UID del paciente a enlazar")


@router.post("/doctor/assign-patient", status_code=200)
def api_assign_patient(payload: schemas.AssignPatientPayload):
    """
    Vincula un paciente al núcleo de un doctor específico utilizando 
    el correo electrónico o el UID del paciente.
    """
    return services.assign_patient_to_doctor(
        doctor_uid=payload.doctor_uid, 
        patient_email_or_uid=payload.patient_id
    )


@router.get("/doctor/{doctor_uid}/my-patients", status_code=200)
def api_get_my_patients(doctor_uid: str):
    """
    Recupera única y exclusivamente el listado de pacientes enlazados 
    al núcleo de atención del médico consultante.
    """
    return services.get_doctor_patients(doctor_uid=doctor_uid)


@router.get("/doctor/patient/{patient_uid}", response_model=schemas.UserRead)
def get_patient_secure_profile(patient_uid: str, doctor_uid: str = Query(...)):
    """
    Endpoint de seguridad extrema: Permite a un doctor abrir el expediente completo 
    de un paciente, SIEMPRE Y CUANDO pertenezca a su núcleo de asignados (?doctor_uid=...).
    """
    from .firebase_client import get_db
    db = get_db()
    
    # 🛡️ Validación en la frontera NoSQL
    link_ref = db.collection("users").document(doctor_uid).collection("assigned_patients").document(patient_uid).get()
    
    if not link_ref.exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso Denegado: Este expediente clínico no pertenece a tu núcleo de pacientes autorizados."
        )
        
    return services.get_user_by_uid(patient_uid)



@router.get("/users/{uid}/expediente-pdf", status_code=status.HTTP_200_OK)
def descargar_expediente_pdf_doctor(uid: str):
    """
    Endpoint para el médico. Compila y descarga en PDF 
    el expediente clínico unificado desde Firestore.
    """
    try:
        return services.generar_pdf_expediente_doctor(uid)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el reporte clínico en PDF: {str(e)}"
        )