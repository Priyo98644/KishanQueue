import time
from typing import List, Dict, Optional
from pydantic import BaseModel

class TokenBucketLimiter:
    def __init__(self, capacity: int = 15, refill_rate: float = 3.0):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.storage: Dict[str, Dict[str, float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        bucket = self.storage.get(client_ip, {"tokens": self.capacity, "updated": now})
        elapsed = now - bucket["updated"]
        bucket["tokens"] = min(self.capacity, bucket["tokens"] + elapsed * self.refill_rate)
        bucket["updated"] = now

        if bucket["tokens"] >= 1.0:
            bucket["tokens"] -= 1.0
            self.storage[client_ip] = bucket
            return True
        self.storage[client_ip] = bucket
        return False

bot_shield = TokenBucketLimiter()

class QueueItem(BaseModel):
    token: str
    arrival_time: float
    declared_weight_qtl: float
    is_perishable: bool = False
    cooldown_bonus: float = 0.0

class ResilientQueueState:
    def __init__(self):
        self.in_memory_store: List[QueueItem] = []

    def push(self, item: QueueItem):
        self.in_memory_store.append(item)

    def get_queue(self) -> List[QueueItem]:
        return self.in_memory_store

live_yard_queue = ResilientQueueState()