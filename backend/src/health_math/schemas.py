from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional



class DoctorCreate(BaseModel):
    email: EmailStr
    hashedPassword: str = Field(..., alias="hashedPassword")
    name: str
    age: int
    countryCode: Optional[str] = None
    
    # 🎯 Campos obligatorios para el perfil médico
    role: str = "pending_doctor" # Entra en modo de espera por seguridad
    specialty: str = Field(..., min_length=3, description="Ej: Cardiólogo, Nutriólogo")
    medical_license: str = Field(..., min_length=2, description="Número de cédula profesional")
    
    # Valores por defecto para heredar la estructura base de usuarios
    weight: float = 0.0
    height: float = 0.0
    gender: str = "male"


class WeightHistoryItem(BaseModel):
    weight: float
    indice: float  # 🎯 Mapea directamente con 'item.indice' (IMC) en tu Next.js
    date: str      # 🎯 Mapea directamente con 'item.date' en tu Next.js

    class Config:
        from_attributes = True


# Esquema para recibir un nuevo comentario desde el Frontend
class MedicalCommentCreate(BaseModel):
    comment: str = Field(..., min_length=5, description="El texto de la anotación médica.")
    doctor_name: Optional[str] = "Sistema RobertCare" # Puede ser el nombre de un médico o el sistema AI
    category: Optional[str] = "general" # Ej: "nutricion", "cardiologia", "general", "urgente"

# 📖 Esquema para enviar los comentarios de vuelta al Frontend
class MedicalCommentRead(BaseModel):
    id: str
    comment: str
    doctor_name: str
    category: str
    date: str
    timestamp: str

    class Config:
        from_attributes = True

# 🆕 Esquema para Creación de Usuario
class UserCreate(BaseModel):
    role: Optional[str] = "patient"
    uid: Optional[str] = None
    email: EmailStr
    hashedPassword: str = Field(..., alias="hashedPassword")
    name: str
    age: int
    countryCode: Optional[str] = None
    tmb_kcal: Optional[float] = None
    getd_kcal: Optional[float] = None
    imc: Optional[float] = None
    medical_history: Optional[str] = None
    
    # 🎯 CORREGIDO: Ahora usamos el tipo estructurado en lugar de Dict[str, Any]
    history: Optional[List[WeightHistoryItem]] = None 
    
    blood_type: Optional[str] = None
    smoking_habits: Optional[str] = None
    alcohol_habits: Optional[str] = None
    sleep_hours: Optional[int] = None
    water_recommendation: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    temperature: Optional[float] = None
    date: Optional[str] = None 
    timestamp: Optional[str] = None
    
    weight: float = 0.0
    height: float = 0.0
    gender: str = "male"
    activityLevel: str = "sedentary"


# Esquema para Lectura de Usuario 
class UserRead(BaseModel):
    role: Optional[str] = "patient"
    uid: Optional[str] = None
    email: EmailStr
    name: str
    age: int
    countryCode: Optional[str] = None
    blood_type: Optional[str] = None
    smoking_habits: Optional[str] = None
    alcohol_habits: Optional[str] = None
    sleep_hours: Optional[int] = None
    tmb_kcal: Optional[float] = None
    getd_kcal: Optional[float] = None
    imc: Optional[float] = None
    weight: float = 0.0
    height: float = 0.0
    gender: str = "male"
    activityLevel: str = "sedentary"
    medical_comments: Optional[List[MedicalCommentRead]] = None
    specialty: Optional[str] = None
    
    # 🎯 CORREGIDO: Esto garantiza que FastAPI obligue a empaquetar 'date' e 'indice' hacia Next.js
    history: Optional[List[WeightHistoryItem]] = None 
    
    medical_history: Optional[str] = None
    water_recommendation: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    temperature: Optional[float] = None
    date: Optional[str] = None 
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class LoginRequest(BaseModel):
    email:str
    password:str

class InsurancePolicyCreate(BaseModel):
    user_email: EmailStr
    policyName: str
    deductible: float
    coinsurancePercentage: int
    coinsuranceCap: float
    currency: Optional[str] = None


class InsurancePolicyRead(BaseModel):
    user_email: EmailStr
    policyName: str
    deductible: float
    coinsurancePercentage: int
    coinsuranceCap: float
    currency: Optional[str] = None


class SimulationCreate(BaseModel):
    user_email: EmailStr
    scenarioName: str
    totalMedicalCost: float
    userOutOfPocket: float
    insuranceCovered: float


class SimulationRead(BaseModel):
    user_email: EmailStr
    scenarioName: str
    totalMedicalCost: float
    userOutOfPocket: float
    insuranceCovered: float
    simulatedAt: datetime


class TermDefinitionCreate(BaseModel):
    term: str
    definition: str
    category: str


class TermDefinitionRead(TermDefinitionCreate):
    pass


class HealthConditionScenarioCreate(BaseModel):
    conditionName: str
    estimatedTotalCost: float
    description: Optional[str] = None
    typicalDurationYears: Optional[int] = None


class HealthConditionScenarioRead(HealthConditionScenarioCreate):
    pass


