from fastapi import APIRouter, HTTPException, status

from . import schemas, services

router = APIRouter(prefix="/health", tags=["health_math"])


@router.post("/users/{uid}", response_model=schemas.UserRead)
def create_user_endpoint(uid: str, user: schemas.UserCreate):
    try:
        from src.health_math.services import _db
        db = _db()
        
        doc_id = uid.strip().lower()
        
        # Verificación en Firestore
        if db.collection("usuarios").document(doc_id).get().exists:
            raise HTTPException(status_code=400, detail="El usuario ya existe.")
            
        return services.create_user(uid=doc_id, data=user)
        
    except Exception as e:
        # 🔥 ESTO VA A IMPRIMIR LA LÍNEA EXACTA DONDE SE ROMPE PYTHON
        import traceback
        print("\n" + "🚨" * 20)
        print("❌ DETALLE DEL ERROR REAL EN EL BACKEND:")
        traceback.print_exc()
        print("🚨" * 20 + "\n")
        
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=list[schemas.UserRead])
def get_users():
	return services.list_users()

@router.post("/login") # 👈 Quitamos el response_model conflictivo
def get_login(credentials: schemas.LoginRequest): # 👈 🎯 FIJADO: Ahora FastAPI sabe qué validar
    return services.get_login(credentials)

@router.get("/users/{uid}", response_model=schemas.UserRead)
def get_user_by_uid(uid: str):
	return services.get_user_by_uid(uid)


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

