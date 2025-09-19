import 'dotenv/config';
import { DataSource } from 'typeorm';

import configuration from './config/configuration';

const config = configuration();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.db,
  entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});
