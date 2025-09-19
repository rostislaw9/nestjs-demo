export default () => ({
  port: parseInt(process.env.PORT ?? '3100', 10),

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    ttl: parseInt(process.env.REDIS_TTL ?? '300', 10),
  },

  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'password',
    db: process.env.POSTGRES_DB ?? 'postgres',
  },

  firebase: {
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? '',
  },
});
