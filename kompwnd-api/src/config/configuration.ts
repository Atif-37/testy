export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 4000,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  neo4j: {
    scheme: process.env.NEO4J_SCHEME,
    port: process.env.NEO4J_PORT,
    host: process.env.NEO4J_HOST,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    database: process.env.NEO4J_DATABASE,
  },
  testnet: true,
  hosts: {
    hyperion: process.env.HYPERION_URL,
    private_key: process.env.PRIVATE_KEY,
  },
});
