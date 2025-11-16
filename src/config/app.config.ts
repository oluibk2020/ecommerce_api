export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL,
  logoUrl: process.env.LOGO_URL,
  appName: process.env.APP_NAME,
  adminEmail: process.env.ADMIN_EMAIL,
});
