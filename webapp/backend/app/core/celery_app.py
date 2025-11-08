"""
Celery application instance used by the worker container.
Provides a basic health task so the worker can start even if no
project tasks have been defined yet.
"""

from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "paintbynumbers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Conservative defaults so jobs run one at a time until tuned.
celery_app.conf.task_default_queue = "default"
celery_app.conf.task_acks_late = True
celery_app.conf.worker_prefetch_multiplier = 1

# Autodiscover tasks in the app package (noop if none exist yet).
celery_app.autodiscover_tasks(["app"])


@celery_app.task(name="app.worker.health_check")
def health_check() -> str:
    """Simple task so we can confirm the worker is alive."""
    return "ok"
