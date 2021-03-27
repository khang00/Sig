interface ID {
  tag: "@type/ID";
  id: string;
}

const ID_TAG: "@type/ID" = "@type/ID";

const toId = (id: string) => {
  return {
    tag: ID_TAG,
    id: id,
  };
};

const toString = (id: ID) => id.id;

interface Persistence<T extends DataRecord> {
  get: (id: ID) => T | undefined;
  getAll: () => T[] | undefined;
  save: (record: T) => T | undefined;
  count: () => number | undefined;
}

class DataRecord {
  private readonly id: ID;

  constructor(id: string) {
    this.id = toId(id);
  }

  getId() {
    return this.id;
  }
}

class MemoryDB<T extends DataRecord> implements Persistence<T> {
  private readonly storage: Record<string, T>;

  constructor() {
    this.storage = {};
  }

  get(id: ID): T | undefined {
    return this.storage[id.id];
  }

  getAll(): T[] | undefined {
    return Object.keys(this.storage).map((key) => this.storage[key]);
  }

  save(record: T): T | undefined {
    this.storage[toString(record.getId())] = record;
    return this.get(record.getId());
  }

  count() {
    return Object.keys(this.storage).length;
  }
}

export { ID, toId, toString, Persistence, MemoryDB, DataRecord };
