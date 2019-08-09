import * as modify from 'modifyjs';

const randomId = (): string => {
  const length = 17;
  let s = '';
  do { s += Math.random().toString(36).substr(2); } while (s.length < length);
  s = s.substr(0, length);

  return s;
}

class FactoryClass {
  name: string;
  collection: any;
  attributes: any;
  afterHooks: any[];
  sequence: number;

  constructor(name, collection, attributes) {
    this.name = name;
    this.collection = collection;
    this.attributes = attributes;
    this.afterHooks = [];
    this.sequence = 0;
  }

  after(fn: any) {
    this.afterHooks.push(fn);
    return this;
  }
};

class Factory {
  factories: Object;

  constructor() {
    this.factories = {};
  }

  define(name, collection, attributes) {
    this.factories[name] = new FactoryClass(name, collection, attributes);
    return this.factories[name];
  }

  get(name) {
    const factory = this.factories[name];
    if (! factory) {
      throw new Error("factory: There is no factory named " + name);
    }
    return factory;
  };

  _build(name, attributes = {}, userOptions = {}, options: any = {}) {
    const self = this;
    const fac = this.get(name);

    // "raw" attributes without functions evaluated, or dotted properties resolved
    const extendedAttributes = {
      ...fac.attributes,
      ...attributes
    };

    // either create a new factory and return its _id
    // or return a 'fake' _id (since we're not inserting anything)
    const makeRelation = relName => {
      if (options.insert) {
        return self.create(relName, {}, userOptions)._id;
      }
      if (options.tree) {
        return self._build(relName, {}, userOptions, {tree: true});
      }
      // fake an id on build
      return randomId();
    };

    const getValue = value => {
      return (value instanceof FactoryClass) ? makeRelation(value.name) : value;
    };

    const getValueFromFunction = (func, record) => {
      const api = { sequence: fn => fn(fac.sequence) };
      const fnRes = func.call(record, api, userOptions);
      return getValue(fnRes);
    };

    fac.sequence += 1;

    const walk = (object, getTop?) => {
      return Object.entries(object).reduce((record, attribute: any) => {
        const getTopRecord = () => {
          return getTop ? getTop() : record;
        }
        const [key, value] = attribute;
        let newValue: any = value;
        // is this a FactoryClass instance?
        if (value instanceof FactoryClass) {
          newValue = makeRelation(value.name);
        } else if (value instanceof Array) {
          newValue = value.map(element => {
            if ({}.toString.call(element) === '[object Function]') {
              return getValueFromFunction(element, getTopRecord());
            }
            return getValue(element);
          });
        } else if ({}.toString.call(value) === '[object Function]') {
          newValue = getValueFromFunction(value, getTopRecord());
        // if an object literal is passed in, traverse deeper into it
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
          record[key] = walk(value, getTopRecord);
          return record;
        }

        const modifier = {$set: {}};

        if (key !== '_id') {
          modifier.$set[key] = newValue;
        }

        record = modify(record, modifier);
        return record
      }, {});
    };

    const result: any = walk(extendedAttributes);

    if (! options.tree) {
      result._id = extendedAttributes._id || randomId();
    }

    return result;
  }

  build(name, attributes = {}, userOptions = {}) {
    return this._build(name, attributes, userOptions);
  }

  tree(name, attributes = {}, userOptions = {}) {
    return this._build(name, attributes, userOptions, {tree: true});
  }

  async _create(name, doc) {
    const collection = this.get(name).collection;
    const insertId = await collection.insert(doc);
    const record = await collection.findOne(insertId);
    return record;
  };

  create(name, attributes = {}, userOptions = {}): any {
    const doc = this._build(name, attributes, userOptions, {insert: true});
    const record = this._create(name, doc);

    this.get(name).afterHooks.forEach(cb => cb(record));

    return record;
  };

  extend(name, attributes = {}) {
    return {
      ...this.get(name).attributes,
      ...attributes
    }
  };
}

export default Factory;
