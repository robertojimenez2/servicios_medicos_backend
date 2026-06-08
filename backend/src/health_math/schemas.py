from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional



class UserCreate(BaseModel):
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
    history: Optional[List[Dict[str, Any]]] = None 
    blood_type: Optional[str] = None       # Ej: "O+", "A-", etc.
    smoking_habits: Optional[str] = None   # Ej: "no_smoker", "occasional", "heavy"
    alcohol_habits: Optional[str] = None   # Ej: "none", "social", "frequent"
    sleep_hours: Optional[int] = None
    water_recommendation: Optional[float] = None
    
    # 🎯 Valores por defecto automáticos si Next.js manda datos vacíos
    weight: float = 0.0
    height: float = 0.0
    gender: str = "male"
    activityLevel: str = "sedentary"

class LoginRequest(BaseModel):
    email:str
    password:str

class UserRead(BaseModel):
    uid: Optional[str] = None
    email: EmailStr
    name: str
    age: int
    countryCode: Optional[str] = None
    blood_type: Optional[str] = None       # Ej: "O+", "A-", etc.
    smoking_habits: Optional[str] = None   # Ej: "no_smoker", "occasional", "heavy"
    alcohol_habits: Optional[str] = None   # Ej: "none", "social", "frequent"
    sleep_hours: Optional[int] = None
    tmb_kcal: Optional[float] = None
    getd_kcal: Optional[float] = None
    imc: Optional[float] = None
    # 🎯 Valores por defecto automáticos si Next.js manda datos vacíos
    weight: float = 0.0
    height: float = 0.0
    gender: str = "male"
    activityLevel: str = "sedentary"
    history: Optional[List[Dict[str, Any]]] = None 
    medical_history: Optional[str] = None
    water_recommendation: Optional[float] = None
    class Config:
        from_attributes = True
        populate_by_name = True


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

