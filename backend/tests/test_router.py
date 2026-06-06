import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.health_math.router import router
from src.health_math import schemas


class RouterTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    @patch("src.health_math.router.services.list_users")
    def test_get_users(self, mock_list_users):
        mock_list_users.return_value = [
            schemas.UserRead(
                email="user@example.com",
                age=25,
                countryCode="US",
                createdAt="2026-01-01T00:00:00Z",
            )
        ]
        response = self.client.get("/health/users")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["email"], "user@example.com")

    @patch("src.health_math.router.services.create_user")
    @patch("src.health_math.router.services.list_users")
    def test_create_user(self, mock_list_users, mock_create_user):
        mock_list_users.return_value = []
        mock_create_user.return_value = schemas.UserRead(
            email="new@example.com",
            age=28,
            countryCode="MX",
            createdAt="2026-01-02T00:00:00Z",
        )
        payload = {
            "email": "new@example.com",
            "hashedPassword": "secret",
            "age": 28,
            "countryCode": "MX",
        }
        response = self.client.post("/health/users", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "new@example.com")

    @patch("src.health_math.router.services.list_users")
    def test_create_user_duplicate(self, mock_list_users):
        mock_list_users.return_value = [
            schemas.UserRead(
                email="existing@example.com",
                age=30,
                countryCode="US",
                createdAt="2026-01-01T00:00:00Z",
            )
        ]
        payload = {
            "email": "existing@example.com",
            "hashedPassword": "secret",
            "age": 30,
            "countryCode": "US",
        }
        response = self.client.post("/health/users", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "User already exists")


if __name__ == "__main__":
    unittest.main()
