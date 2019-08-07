import monk, { ICollection } from 'monk';
// Map `db.name` to actual mongo collection name
enum COLLECTIONS {
    Authors = 'authors',
    Books = 'books'
}

export type MongoDatabase = {
    [c in COLLECTIONS]: ICollection;
};

export async function createDatabase(
    mongoUrl: string,
): Promise<MongoDatabase> {
    // monk() returns a fake promise. Use .then() to extract an
    // actual promise so we can propagate fatal errors.
    const db = monk(mongoUrl);
    await monk(mongoUrl).then(() => { });

    // This sets options on all db operations:
    // https://github.com/Automattic/monk/tree/master/docs/collection
    //
    // We *must* have castIds: false, otherwise Monk will try
    // to case our Meteor generated random _id string to ObjectID,
    // which demands it to be 12 or 24 chars long (which Meteor doesn't generate).
    const options = {
        castIds: false,
    };

    const collections = Object.values(COLLECTIONS).reduce(
        (colls, collectionName) => ({
            ...colls,
            [collectionName]: db.get(collectionName, options),
        }),
        {} as MongoDatabase
    );

    // Export all collection names from COLLECTIONS
    return collections;
}
