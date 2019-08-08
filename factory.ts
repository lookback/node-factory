import * as modify from 'modifyjs';

/* global Factory:true */

const randomId = (): string => {
  const length = 17;
  let s = '';
  do { s += Math.random().toString(36).substr(2); } while (s.length < length);
  s = s.substr(0, length);

  return s;
}

const factories = {};

let factory: any = {};

class FactoryClass {
  name: string;
  collection: any;
  attributes: any;
  afterHooks: string[];
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

factory.define = (name, collection, attributes) => {
  factories[name] = new FactoryClass(name, collection, attributes);
  return factories[name];
};

factory.get = name => {
  const factory = factories[name];
  if (! factory) {
    throw new Error("factory: There is no factory named " + name);
  }
  return factory;
};

factory._build = (name, attributes = {}, userOptions = {}, options = {}) => {
  const fac = factory.get(name);

  // "raw" attributes without functions evaluated, or dotted properties resolved
  const extendedAttributes = {
    ...fac.attributes,
    ...attributes
  };

  // either create a new factory and return its _id
  // or return a 'fake' _id (since we're not inserting anything)
  const makeRelation = relName => {
    if (options.insert) {
      return factory.create(relName, {}, userOptions)._id;
    }
    if (options.tree) {
      return factory._build(relName, {}, userOptions, {tree: true});
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
};

factory.build = (name, attributes = {}, userOptions = {}) => {
  return factory._build(name, attributes, userOptions);
};

factory.tree = (name, attributes, userOptions = {}) => {
  return factory._build(name, attributes, userOptions, {tree: true});
};

factory._create = async (name, doc) => {
  const collection = factory.get(name).collection;
  const insertId = await collection.insert(doc);
  const record = await collection.findOne(insertId);
  return record;
};

factory.create = (name, attributes = {}, userOptions = {}) => {
  const doc = factory._build(name, attributes, userOptions, {insert: true});
  const record = factory._create(name, doc);

  factory.get(name).afterHooks.forEach(cb => cb(record));

  return record;
};

factory.extend = (name, attributes = {}) => {
  return {
    ...factory.get(name).attributes,
    ...attributes
  }
};

export default factory;
