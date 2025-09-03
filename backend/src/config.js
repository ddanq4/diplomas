import 'dotenv/config';
export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  allowSelfRegister: String(process.env.ALLOW_SELF_REGISTER || '').toLowerCase() === 'true',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileMb: Number(process.env.MAX_FILE_MB || process.env.UPLOAD_MAX_MB || process.env.FILE_MAX_MB || 10),
};
