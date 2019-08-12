# Node Factory

A package for creating test data or for generating fixtures.

## Table of Contents

- [Examples](https://github.com/lookback/node-factory#examples)
  - [Defining factories](https://github.com/lookback/node-factory#defining-factories)
  - [Creating documents](https://github.com/lookback/node-factory#creating-documents)
- [API](https://github.com/lookback/node-factory#api)
  - [define](https://github.com/lookback/node-factory#define)
  - [get](https://github.com/lookback/node-factory#get)
  - [build](https://github.com/lookback/node-factory#build)
  - [tree](https://github.com/lookback/node-factory#tree)
  - [create](https://github.com/lookback/node-factory#create)
  - [extend](https://github.com/lookback/node-factory#extend)
- [Other](https://github.com/lookback/node-factory#)

## Examples

### Defining factories

```javascript
import Factory from 'factory';

const factory = new Factory();

// Reference to mongo collections. Depending on how you interface with mongo
// getting these references will vary. The important part is that the collection
// should have the async functions `insert` and `findOne`.
const { authors, books } = db;

factory.define('author', authors, {
  name: 'John Smith'
}).after(author => {
  // Do something smart
});

factory.define('book', books, {
  authorId: factory.get('author'),
  name: 'A book',
  year() { return _.random(1900, 2014); }
});

// We can also extend from an existing factory
factory.define('anotherBook', books, factory.extend('book', {
  // ...
}));
```

### Creating documents

```javascript
// Ex. 1: Inserts a new book into the books collection
const book = factory.create('book');

// Ex. 2: New fields can be added or overwritten
const book = factory.create('book', { name: 'A better book' });
```

## API

Note: When calling `factory.create('book')` both the Book *and* an Author are created. The newly created Author `_id` will then be automatically assigned to that field. In the case of calling `factory.build('book')` as no insert operations are run, the `_id` will be faked.

### define

`factory.define('name', Collection, doc).after(doc => { ... })`

- name
  - A name for this factory
- Collection
  - A mongo collection
- doc
  - Document object
- *.after* hook (Optional)
  - Returns the newly inserted document after calling `factory.create`

### get

`factory.get('name')`

Returns the instance of *name*. Typical usage is to specify a relationship between collections as seen in the Book example above.

### build

`factory.build('name', doc)`

Builds the data structure for this factory

- name
  - The name defined for this factory
- doc (Optional)
  - Document object

### tree

`factory.tree('name', doc)`

Builds an object tree without `_id` fields. Useful for generating data for templates.

- name
  - The name define for this factory
- doc (Optional)
  - Document object

Example:

```js
  factory.define('author', authors, {
    name: "John Smith"
  });

  factory.define('book', books, {
    name: "A book",
    author: factory.get('author')
  });

  const book = factory.tree('book');
```

`book` then equals:

```
{
  name: 'A book',
  author: {
    name: 'John Smith'
  }
}
```

### create

`factory.create('name', doc)`

Creates (inserts) this factory into mongodb

- name
  - The name defined for this factory
- doc (Optional)
  - Document object

### extend

`factory.extend('name', doc)`

Extend from an existing factory

- name
  - The name defined for this factory
- doc (Optional)
  - Document object

## License

MIT.

Node Factory is based on https://github.com/versolearning/meteor-factory
MIT. (c) Percolate Studio
