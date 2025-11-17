import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  LOGO_URL: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().required(),
  ONESIGNAL_TOKEN: Joi.string().required(),
  ONESIGNAL_APP_ID: Joi.string().required(),
  ONESIGNAL_SENDER: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_SENDER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_USER: Joi.string().required(),
  CORS_ORIGIN: Joi.string().required(),
});
