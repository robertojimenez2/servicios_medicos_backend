from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
	email: EmailStr
	hashedPassword: str = Field(..., alias="hashedPassword")
	age: int
	countryCode: Optional[str] = None


class UserRead(BaseModel):
	email: EmailStr
	age: int
	countryCode: Optional[str] = None
	createdAt: datetime


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

