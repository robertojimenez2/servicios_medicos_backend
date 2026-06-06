from fastapi import APIRouter, HTTPException

from . import schemas, services

router = APIRouter(prefix="/health", tags=["health_math"])


@router.post("/users", response_model=schemas.UserRead)
def create_user(user: schemas.UserCreate):
	# rudimentary duplicate check
	existing = [u for u in services.list_users() if u.email == user.email]
	if existing:
		raise HTTPException(status_code=400, detail="User already exists")
	return services.create_user(user)


@router.get("/users", response_model=list[schemas.UserRead])
def get_users():
	return services.list_users()


@router.post("/policies", response_model=schemas.InsurancePolicyRead)
def create_policy(policy: schemas.InsurancePolicyCreate):
	
	return services.create_policy(policy)


@router.get("/policies", response_model=list[schemas.InsurancePolicyRead])
def get_policies():
	return services.list_policies()


@router.post("/simulations", response_model=schemas.SimulationRead)
def create_simulation(sim: schemas.SimulationCreate):
	return services.create_simulation(sim)


@router.get("/simulations", response_model=list[schemas.SimulationRead])
def get_simulations():
	return services.list_simulations()


@router.post("/terms", response_model=schemas.TermDefinitionRead)
def create_term(term: schemas.TermDefinitionCreate):
	return services.create_term(term)


@router.get("/terms", response_model=list[schemas.TermDefinitionRead])
def get_terms():
	return services.list_terms()


@router.post("/scenarios", response_model=schemas.HealthConditionScenarioRead)
def create_scenario(s: schemas.HealthConditionScenarioCreate):
	return services.create_scenario(s)


@router.get("/scenarios", response_model=list[schemas.HealthConditionScenarioRead])
def get_scenarios():
	return services.list_scenarios()

