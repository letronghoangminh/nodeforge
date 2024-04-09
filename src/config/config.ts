export default () => ({
  app: {
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    root: process.env.APPLICATION_ROOT,
  },
  swagger: {
    docsUrl: process.env.DOCS_URL || 'docs',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
  mail: {
    host: process.env.MAIL_HOST,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
  },
  githubApp: {
    name: process.env.GITHUB_APP_NAME,
    id: process.env.GITHUB_APP_ID,
    privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, 'base64'),
  },
});
