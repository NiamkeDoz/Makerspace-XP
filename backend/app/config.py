from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://makerspace:makerspace@localhost:5432/makerspace_xp"

    class Config:
        env_file = ".env"


settings = Settings()
