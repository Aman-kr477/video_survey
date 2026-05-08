from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.orm import Session
from backend.app.common.base_model import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):

    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, record_id: str) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == record_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, record_id: str) -> bool:
        obj = self.get_by_id(record_id)
        if obj is None:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
