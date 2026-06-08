from fastapi import APIRouter, HTTPException, status
from . import schemas, services

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
def get_users():
    return services.list_users()


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

# ... (El resto de tus rutas de pólizas, simulaciones, etc., se quedan intactas)

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

