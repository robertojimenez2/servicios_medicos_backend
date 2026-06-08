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


def create_user(uid: str, data: schemas.UserCreate) -> schemas.UserRead:
    db = _db()
    now = datetime.now(timezone.utc)
    
    # Construimos el payload plano para Firestore
    payload = {
        "uid": uid, # Usamos el uid validado
        "email": data.email,
		"name": data.name,
        "hashedPassword": data.hashedPassword,
        "age": data.age,
        "countryCode": data.countryCode,
        "createdAt": now,
    }
    
    # Guardamos usando el UID como el nombre oficial del documento
    db.collection("users").document(uid).set(payload)
    
    return schemas.UserRead(
        uid=uid,
        email=data.email, 
        age=data.age, 
		name=data.name,
        countryCode=data.countryCode, 
        createdAt=now
    )

from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

def get_login(credentials: LoginRequest):
    from src.health_math.services import _db
    db = _db()
    
    doc_id = credentials.email.strip().lower()
    # Buscamos en la colección "users" tal como se ve en tu consola
    user_ref = db.collection("users").document(doc_id).get()
    
    if not user_ref.exists:
        raise HTTPException(status_code=404, detail="El usuario no está registrado.")
        
    user_data = user_ref.to_dict()
    
    if user_data.get("hashedPassword") != credentials.password:
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
    
    # 🎯 Buscamos directamente el documento cuyo ID sea igual al UID de Firebase
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    # 🔒 Si el usuario no existe en la base de datos, lanzamos un error 404
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El usuario con UID {uid} no fue encontrado en RobertCare."
        )

    # Convertimos el documento de Firestore en un diccionario de Python
    user_data = user_doc.to_dict()
    
    # Retornamos los datos. FastAPI se encargará de validarlos con tu esquema 'UserRead'
    return user_data

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

