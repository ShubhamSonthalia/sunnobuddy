import copy
import uuid
from datetime import datetime, timezone

class MockDocSnapshot:
    def __init__(self, doc_id: str, data: dict | None):
        self.id = doc_id
        self._data = copy.deepcopy(data) if data is not None else None
        self.exists = data is not None

    def to_dict(self):
        return copy.deepcopy(self._data) if self._data is not None else None


def _resolve_val(val, current):
    # Handle firestore.SERVER_TIMESTAMP
    val_type = type(val).__name__
    if "SERVER_TIMESTAMP" in str(val) or val_type == "Sentinel" or hasattr(val, "__class__") and "Sentinel" in val.__class__.__name__:
        return datetime.now(timezone.utc)
    # Handle firestore.Increment(n)
    if "Increment" in val_type or hasattr(val, "operand"):
        operand = getattr(val, "operand", 1)
        curr = current if isinstance(current, (int, float)) else 0
        return curr + operand
    return val


class MockDocRef:
    def __init__(self, collection, doc_id: str):
        self._collection = collection
        self.id = doc_id
        self._subcollections = {}

    def get(self):
        data = self._collection._docs.get(self.id)
        return MockDocSnapshot(self.id, data)

    def set(self, data: dict, merge: bool = False):
        existing = self._collection._docs.get(self.id, {}) if merge else {}
        resolved = dict(existing)
        for k, v in data.items():
            resolved[k] = _resolve_val(v, resolved.get(k))
        self._collection._docs[self.id] = resolved

    def update(self, updates: dict):
        existing = self._collection._docs.setdefault(self.id, {})
        for k, v in updates.items():
            existing[k] = _resolve_val(v, existing.get(k))

    def delete(self):
        self._collection._docs.pop(self.id, None)

    def collection(self, name: str):
        if name not in self._subcollections:
            self._subcollections[name] = MockCollectionRef(name, parent_doc=self)
        return self._subcollections[name]


class MockQuery:
    def __init__(self, collection, filters=None, orders=None, limit_count=None, selected_fields=None):
        self._collection = collection
        self._filters = filters or []
        self._orders = orders or []
        self._limit_count = limit_count
        self._selected_fields = selected_fields

    def where(self, field: str, op: str, value):
        new_filters = list(self._filters)
        new_filters.append((field, op, value))
        return MockQuery(self._collection, new_filters, self._orders, self._limit_count, self._selected_fields)

    def order_by(self, field: str, direction=None):
        new_orders = list(self._orders)
        new_orders.append((field, str(direction).lower() if direction else "asc"))
        return MockQuery(self._collection, self._filters, new_orders, self._limit_count, self._selected_fields)

    def limit(self, count: int):
        return MockQuery(self._collection, self._filters, self._orders, count, self._selected_fields)

    def select(self, fields: list):
        return MockQuery(self._collection, self._filters, self._orders, self._limit_count, fields)

    def stream(self):
        items = []
        for doc_id, data in list(self._collection._docs.items()):
            match = True
            for field, op, val in self._filters:
                doc_val = data.get(field)
                if doc_val is None:
                    match = False
                    break
                try:
                    if op == "==" and not (doc_val == val):
                        match = False; break
                    elif op == ">=" and not (doc_val >= val):
                        match = False; break
                    elif op == "<=" and not (doc_val <= val):
                        match = False; break
                    elif op == ">" and not (doc_val > val):
                        match = False; break
                    elif op == "<" and not (doc_val < val):
                        match = False; break
                except TypeError:
                    match = False; break
            if match:
                items.append((doc_id, data))

        # Sort
        for field, direction in reversed(self._orders):
            is_desc = "desc" in direction
            items.sort(key=lambda x: (x[1].get(field) is None, x[1].get(field)), reverse=is_desc)

        if self._limit_count is not None:
            items = items[: self._limit_count]

        for doc_id, data in items:
            out_data = data
            if self._selected_fields:
                out_data = {k: data[k] for k in self._selected_fields if k in data}
            yield MockDocSnapshot(doc_id, out_data)


class MockCollectionRef:
    def __init__(self, name: str, parent_doc=None):
        self.name = name
        self.parent = parent_doc
        self._docs = {}
        self._doc_refs = {}

    def document(self, doc_id: str | None = None) -> MockDocRef:
        if not doc_id:
            doc_id = uuid.uuid4().hex[:20]
        if doc_id not in self._doc_refs:
            self._doc_refs[doc_id] = MockDocRef(self, doc_id)
        return self._doc_refs[doc_id]

    def add(self, data: dict):
        ref = self.document()
        ref.set(data)
        return datetime.now(timezone.utc), ref

    def where(self, field: str, op: str, value):
        return MockQuery(self).where(field, op, value)

    def order_by(self, field: str, direction=None):
        return MockQuery(self).order_by(field, direction)

    def limit(self, count: int):
        return MockQuery(self).limit(count)

    def select(self, fields: list):
        return MockQuery(self).select(fields)

    def stream(self):
        return MockQuery(self).stream()


class MockWriteBatch:
    def __init__(self):
        self._ops = []

    def set(self, ref: MockDocRef, data: dict, merge: bool = False):
        self._ops.append(("set", ref, data, merge))

    def update(self, ref: MockDocRef, updates: dict):
        self._ops.append(("update", ref, updates))

    def delete(self, ref: MockDocRef):
        self._ops.append(("delete", ref))

    def commit(self):
        for op in self._ops:
            if op[0] == "set":
                op[1].set(op[2], merge=op[3])
            elif op[0] == "update":
                op[1].update(op[2])
            elif op[0] == "delete":
                op[1].delete()
        self._ops.clear()


class MockFirestoreDb:
    def __init__(self):
        self._collections = {}

    def collection(self, name: str) -> MockCollectionRef:
        if name not in self._collections:
            self._collections[name] = MockCollectionRef(name)
        return self._collections[name]

    def batch(self) -> MockWriteBatch:
        return MockWriteBatch()


_local_db_instance = None

def get_local_db() -> MockFirestoreDb:
    global _local_db_instance
    if _local_db_instance is None:
        _local_db_instance = MockFirestoreDb()
    return _local_db_instance
