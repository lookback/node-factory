import * as assert from 'assert';
import { mockMongo, unmockMongo } from './_mock-mongo';
import { test } from 'loltest';

test(
  "Factory - Build - Basic build works",
  mockMongo,
  async ({ db, factory }) => {
      factory.define('author', db.authors, {
        name: "John Smith"
      });

      assert.equal(factory.build('author').name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Define - After hook",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    }).after(async (doc) => {
      var author = await factory.create('author');
      assert.equal(author.name, "John Smith");
      assert.equal(doc.name, "John Smith");
    });
  },
  unmockMongo
);

test(
  "Factory - Build - Functions - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name() {
        return "John Smith";
      }
    });

    assert.equal(factory.build('author').name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Functions - Context",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      test: "John Smith",
      name() {
        // This only works if `test`is defined before `name`.
        // Swapping places will fail the test.
        return this.test;
      }
    });

    assert.equal(factory.build('author').name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Dotted properties - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      "profile.name": "John Smith"
    });

    assert.equal(factory.build('author').profile.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Dotted properties - Context",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith",
      'profile.name'() {
        return this.name;
      }
    });

    assert.equal(factory.build('author').profile.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Deep objects",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      profile: {
        name: "John Smith"
      }
    });

    assert.equal(factory.build('author').profile.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Functions - Deep object - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      profile: {
        name() {
          return "John Smith";
        }
      }
    });

    assert.equal(factory.build('author').profile.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Functions - Deep object - Context",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith",
      profile: {
        name() {
          return this.name;
        }
      }
    });

    assert.equal(factory.build('author').profile.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Extend - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('authorOne', db.authors, factory.extend('author'));

    assert.equal(factory.build('authorOne').name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Extend - With attributes",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('authorOne', db.authors, factory.extend('author', {
      test: "testing!"
    }));

    assert.equal(factory.build('authorOne').name, "John Smith");
    assert.equal(factory.build('authorOne').test, "testing!");
  },
  unmockMongo
);

test(
  "Factory - Build - Extend - With attributes (check that we don't modify the parent)",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('authorOne', db.books, factory.extend('author', {
      test: "testing!"
    }));

    var authorOne = factory.build('authorOne');
    var author = factory.build('author');

    assert.equal(authorOne.name, "John Smith");
    assert.equal(authorOne.test, "testing!");
    assert.equal(typeof author.test, 'undefined');
  },
  unmockMongo
);

test(
  "Factory - Build - Extend - Parent with relationship",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorId: factory.get('author'),
      name: "A book",
      year: 2014
    });

    factory.define('bookOne', db.books, factory.extend('book'));

    var bookOne = await factory.create('bookOne');

    assert.equal(bookOne.name, "A book");
  },
  unmockMongo
);

test(
  "Factory - Build - Extend - Parent with relationship - Extra attributes",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorId: factory.get('author'),
      name: "A book",
      year: 2014
    });

    factory.define('bookOne', db.books, factory.extend('book', {
      name: "A better book"
    }));

    var bookOne = await factory.create('bookOne');

    assert.equal(bookOne.name, "A better book");
    // same year as parent
    assert.equal(bookOne.year, 2014);
  },
  unmockMongo
);

test(
  "Factory - Create - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    var author = await factory.create('author');

    assert.equal(author.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Create - Relationship",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorId: factory.get('author'),
      name: "A book",
      year: 2014
    });

    var book = await factory.create('book');

    assert.equal((await db.authors.findOne(book.authorId)).name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Create - Relationship - return a Factory from function",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorId() {
        return factory.get('author');
      },
      name: "A book",
      year: 2014
    });

    var book = await factory.create('book');

    assert.equal((await db.authors.findOne(book.authorId)).name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Create - Relationship - return a Factory from deep function (dotted)",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      'good.authorId'() {
        return factory.get('author');
      },
      name: "A book",
      year: 2014
    });

    var book = await factory.create('book');

    assert.equal((await db.authors.findOne(book.good.authorId)).name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Create - Relationship - return a Factory from deep function",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      good: {
        authorId() {
          return factory.get('author');
        }
      },
      name: "A book",
      year: 2014
    });

    var book = await factory.create('book');

    assert.equal((await db.authors.findOne(book.good.authorId)).name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - Sequence",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith",
      email(factory) {
        return factory.sequence(n => 'person' + n + '@example.com');
      }
    });

    var author = factory.build('author');
    assert.equal(author.email, "person1@example.com");
    var author2 = factory.build('author');
    assert.equal(author2.email, "person2@example.com");
  },
  unmockMongo
);

test(
  "Factory - Create - Sequence",
  mockMongo,
  async ({ db, factory }) => {
    db.authors.remove({});

    factory.define('author', db.authors, {
      name: "John Smith",
      email(factory) {
        return factory.sequence(n => 'person' + n + '@example.com');
      }
    });

    var author = await factory.create('author');
    assert.equal(author.email, "person1@example.com");
    var foundAuthor = await db.authors.count({email: "person1@example.com"});
    assert.equal(foundAuthor, 1);

    var author2 = await factory.create('author');
    assert.equal(author2.email, "person2@example.com");
    var foundAuthor2 = await db.authors.count({email: "person2@example.com"});
    assert.equal(foundAuthor2, 1);
  },
  unmockMongo
);

test(
  "Factory - Build - Array with Factory",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorIds: [factory.get('author'), 'PXm6dye7A8vgoB7uY']
    });

    const book = factory.build('book');

    assert.equal(book.authorIds.length, 2);
    assert.equal(book.authorIds[0].length, 17);
  },
  unmockMongo
);

test(
  "Factory - Build - Array with function returning a Factory",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      authorIds: [() => factory.get('author'), 'PXm6dye7A8vgoB7uY']
    });

    const book = factory.build('book');

    assert.equal(book.authorIds.length, 2);
    assert.equal(book.authorIds[0].length, 17);
  },
  unmockMongo
);

test(
  "Factory - Build - Array with an object",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('book', db.books, {
      array: [{objectInArray: true}]
    });

    const book = factory.build('book');

    assert.ok(book.array[0].objectInArray);
  },
  unmockMongo
);

// Could possibly make this a feature:
// test(
//  "Factory - Build - Array with an object containing a function",
//  mockMongo,
//  async ({ db, factory }) => {
//   factory.define('book', db.books, {
//     array: [{objectInArrayWithFn: () => true}]
//   });

//   const book = factory.build('book');

//   assert.equal(book.array[0].objectInArrayWithFn, true);
// },
//  unmockMongo
//  );

test(
  "Factory - Tree - Basic",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith"
    });

    factory.define('book', db.books, {
      name: "A book",
      author: factory.get('author')
    });

    const book = factory.tree('book');

    assert.equal(book.author.name, "John Smith");
  },
  unmockMongo
);

test(
  "Factory - Build - With options",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('author', db.authors, {
      name: "John Smith",
      books(factory, options = { bookCount: 2 }) {
        const self = this;
        return Array.from({length: options.bookCount}).map((v, count: number) => {
          return `${count + 1} book by ${self.name}`;
        });
      }
    });

    const author = factory.build('author', {}, { bookCount: 3 });

    assert.equal(author.books.length, 3);
    assert.deepEqual(author.books, [
      '1 book by John Smith',
      '2 book by John Smith',
      '3 book by John Smith',
    ]);
  },
  unmockMongo
);

test(
  "Factory - Create - With options",
  mockMongo,
  async ({ db, factory }) => {
    factory.define('book', db.books, {
      name: "A book",
      pages(factory, options = { pageCount: 2 }) {
        const self = this;
        return Array.from({length: options.pageCount}).map((v, count: number) => {
          return `Page ${count + 1}`;
        });
      }
    });

    const book = await factory.create('book', {}, { pageCount: 2 });

    assert.equal(book.pages.length, 2);
    assert.deepEqual(book.pages, [
      'Page 1',
      'Page 2',
    ]);
  },
  unmockMongo
);
