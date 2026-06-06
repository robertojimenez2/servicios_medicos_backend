from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, List, Optional

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


def create_user(data: schemas.UserCreate) -> schemas.UserRead:
	db = _db()
	now = datetime.now(timezone.utc)
	payload = {
		"email": data.email,
		"hashedPassword": data.hashedPassword,
		"age": data.age,
		"countryCode": data.countryCode,
		"createdAt": now,
	}
	# Use email as document ID to prevent duplicates
	db.collection("users").document(data.email).set(payload)
	return schemas.UserRead(email=data.email, age=data.age, countryCode=data.countryCode, createdAt=now)


def list_users() -> List[schemas.UserRead]:
	db = _db()
	docs = db.collection("users").stream()
	results: List[schemas.UserRead] = []
	for doc in docs:
		d = doc.to_dict()
		results.append(
			schemas.UserRead(
				email=d.get("email"),
				age=d.get("age"),
				countryCode=d.get("countryCode"),
				createdAt=_normalize_datetime(d.get("createdAt")),
			)
		)
	return results


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

