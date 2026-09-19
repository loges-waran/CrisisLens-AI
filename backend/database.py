from sqlalchemy import create_engine, Column, Integer, String, Text, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "sqlite:///./crisislens.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String)
    disaster_type = Column(String)
    description = Column(Text)
    people_affected = Column(Integer)
    severity = Column(String)
    risk_score = Column(Integer)

    # New map fields
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)


# Add new columns to an existing database
# without deleting our old incidents.
def update_database():

    inspector = inspect(engine)

    columns = [
        column["name"]
        for column in inspector.get_columns("incidents")
    ]

    with engine.begin() as connection:

        if "latitude" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE incidents "
                    "ADD COLUMN latitude VARCHAR"
                )
            )

        if "longitude" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE incidents "
                    "ADD COLUMN longitude VARCHAR"
                )
            )


update_database()