from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from core.database import Base

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, server_default=func.now())
    value = Column(JSONB, nullable=False)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(JSONB, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, nullable=True)
    value = Column(JSONB, nullable=False)

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, nullable=False)
    value = Column(JSONB, nullable=False)


class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(JSONB, nullable=False)

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(JSONB, nullable=False)

class BusinessJob(Base):
    __tablename__ = "business_jobs"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(JSONB, nullable=False)

class Design(Base):
    __tablename__ = "designs"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(JSONB, nullable=False)
