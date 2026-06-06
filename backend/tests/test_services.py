import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from src.health_math import schemas
from src.health_math import services


class FakeDoc:
    def __init__(self, data):
        self._data = data

    def to_dict(self):
        return self._data


class FakeCollection:
    def __init__(self):
        self.docs = []

    def document(self, document_id):
        class DocumentRef:
            def __init__(self, parent, doc_id):
                self.parent = parent
                self.doc_id = doc_id

            def set(self, payload):
                self.parent.docs.append(payload)

        return DocumentRef(self, document_id)

    def add(self, payload):
        self.docs.append(payload)
        return None

    def stream(self):
        return [FakeDoc(doc) for doc in self.docs]


class FakeFirestore:
    def __init__(self):
        self.collections = {}

    def collection(self, name):
        if name not in self.collections:
            self.collections[name] = FakeCollection()
        return self.collections[name]


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.fake_db = FakeFirestore()
        patcher = patch("src.health_math.services._db", return_value=self.fake_db)
        self.addCleanup(patcher.stop)
        self.mock_db = patcher.start()

    def test_create_and_list_users(self):
        user_data = schemas.UserCreate(
            email="test@example.com",
            hashedPassword="secret",
            age=30,
            countryCode="US",
        )
        created = services.create_user(user_data)
        self.assertEqual(created.email, "test@example.com")
        self.assertEqual(created.age, 30)
        self.assertEqual(created.countryCode, "US")
        self.assertIsInstance(created.createdAt, datetime)
        self.assertIsNotNone(created.createdAt.tzinfo)
        self.assertEqual(created.createdAt.tzinfo, timezone.utc)

        users = services.list_users()
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0].email, "test@example.com")
        self.assertEqual(users[0].age, 30)
        self.assertEqual(users[0].countryCode, "US")
        self.assertIsInstance(users[0].createdAt, datetime)
        self.assertIsNotNone(users[0].createdAt.tzinfo)
        self.assertEqual(users[0].createdAt.tzinfo, timezone.utc)

    def test_create_policy_and_list(self):
        policy_data = schemas.InsurancePolicyCreate(
            user_email="test@example.com",
            policyName="Test Coverage",
            deductible=500.0,
            coinsurancePercentage=20,
            coinsuranceCap=1500.0,
            currency="USD",
        )
        created = services.create_policy(policy_data)
        self.assertEqual(created.policyName, "Test Coverage")
        self.assertEqual(created.user_email, "test@example.com")

        policies = services.list_policies()
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0].policyName, "Test Coverage")

    def test_create_simulation_and_list(self):
        sim_data = schemas.SimulationCreate(
            user_email="test@example.com",
            scenarioName="Scenario 1",
            totalMedicalCost=2000.0,
            userOutOfPocket=400.0,
            insuranceCovered=1600.0,
        )
        created = services.create_simulation(sim_data)
        self.assertEqual(created.scenarioName, "Scenario 1")
        self.assertEqual(created.user_email, "test@example.com")
        self.assertEqual(created.insuranceCovered, 1600.0)
        self.assertIsInstance(created.simulatedAt, datetime)
        self.assertIsNotNone(created.simulatedAt.tzinfo)
        self.assertEqual(created.simulatedAt.tzinfo, timezone.utc)

        simulations = services.list_simulations()
        self.assertEqual(len(simulations), 1)
        self.assertEqual(simulations[0].scenarioName, "Scenario 1")
        self.assertIsInstance(simulations[0].simulatedAt, datetime)
        self.assertIsNotNone(simulations[0].simulatedAt.tzinfo)
        self.assertEqual(simulations[0].simulatedAt.tzinfo, timezone.utc)

    def test_create_term_and_list(self):
        term_data = schemas.TermDefinitionCreate(
            term="Deductible",
            definition="Amount paid before insurance covers costs.",
            category="insurance",
        )
        created = services.create_term(term_data)
        self.assertEqual(created.term, "Deductible")

        terms = services.list_terms()
        self.assertEqual(len(terms), 1)
        self.assertEqual(terms[0].definition, "Amount paid before insurance covers costs.")

    def test_create_scenario_and_list(self):
        scenario_data = schemas.HealthConditionScenarioCreate(
            conditionName="Flu",
            estimatedTotalCost=300.0,
            description="Common short-term illness.",
            typicalDurationYears=1,
        )
        created = services.create_scenario(scenario_data)
        self.assertEqual(created.conditionName, "Flu")

        scenarios = services.list_scenarios()
        self.assertEqual(len(scenarios), 1)
        self.assertEqual(scenarios[0].conditionName, "Flu")


if __name__ == "__main__":
    unittest.main()
