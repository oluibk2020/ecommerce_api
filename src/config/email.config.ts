export default () => ({
  oneSignal: {
    apiToken: process.env.ONESIGNAL_TOKEN,
    appID: process.env.ONESIGNAL_APP_ID,
    sender: process.env.ONESIGNAL_SENDER,
  },
  email: {
    host: process.env.EMAIL_HOST,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    sender: process.env.EMAIL_SENDER,
  },
});
