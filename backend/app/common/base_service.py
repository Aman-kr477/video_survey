from abc import ABC


class BaseService(ABC):
    """Base service interface. All domain services extend this class.

    Services contain business logic and delegate persistence to repositories.
    Controllers call services; services never call controllers.
    """
    pass
