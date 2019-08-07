import { MongoMemoryServer } from 'mongodb-memory-server';
import { createDatabase, MongoDatabase } from './mongo-connector';

export interface MockMongo {
    mongod: MongoMemoryServer;
    mongoUrl: string;
    db: MongoDatabase;
}

export const mockMongo = async (): Promise<MockMongo> => {
    const mongod = new MongoMemoryServer({
        binary: {
            version: "3.6.12",
        },
    });
    const mongoUrl = await mongod.getConnectionString();
    const db = await createDatabase(mongoUrl);
    return { mongod, mongoUrl, db };
};

export const unmockMongo = ({ mongod }: MockMongo) => {
    mongod.stop();
};
