export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || '',
    token: process.env.CLOUDFLARE_API_TOKEN || '',
  },
};
