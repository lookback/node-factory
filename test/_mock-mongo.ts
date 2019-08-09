import { MongoMemoryServer } from 'mongodb-memory-server';
import { createDatabase, MongoDatabase } from './mongo-connector';
import Factory from '../src/factory';

export interface MockMongo {
    mongod: MongoMemoryServer;
    mongoUrl: string;
    db: MongoDatabase;
    factory: Factory;
}

export const mockMongo = async (): Promise<MockMongo> => {
    const mongod = new MongoMemoryServer({
        binary: {
            version: "3.6.12",
        },
    });
    const mongoUrl = await mongod.getConnectionString();
    const db = await createDatabase(mongoUrl);
    const factory = new Factory();
    return { mongod, mongoUrl, db, factory };
};

export const unmockMongo = ({ mongod }: MockMongo) => {
    mongod.stop();
};
