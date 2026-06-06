from fastapi import FastAPI

from src.health_math.router import router as health_router

app = FastAPI()
app.include_router(health_router)


def main():
    print("Hello from backend!")


if __name__ == "__main__":
    main()
