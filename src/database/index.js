import Sequelize from 'sequelize';
import databaseConfig from '../config/database';
import User from '../app/models/User';
import File from '../app/models/File';
import Appointments from '../app/models/Appointment';
import mongoose from 'mongoose';

const models = [User, File, Appointments];

class Database {
    constructor() {
        this.init();
    }

    init() {
        this.connection = new Sequelize(databaseConfig);
        models
            .map(model => model.init(this.connection))
            .map(
                model =>
                    model.associate && model.associate(this.connection.models)
            );
    }

    mongo() {
        this.mongoConnection = mongoose.connect(
            'mongodb://localhost:27017/gobarber',
            { useNewUrlParser: true, useFindAndModify: true }
        );
    }
}

export default new Database();
