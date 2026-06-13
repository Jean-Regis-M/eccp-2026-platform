import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
import { existsSync, mkdirSync } from 'fs';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Configure S3 client if credentials are available
const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Check if S3 bucket is configured
const useS3 = process.env.AWS_S3_BUCKET && process.env.AWS_S3_BUCKET.trim() !== '';

// Initialize S3 client only if we have credentials and bucket
const s3 = useS3 ? new S3Client(s3Config) : null;

export const upload = multer({
  storage: useS3
    ? multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET,
        metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (req, file, cb) => cb(null, `uploads/${Date.now().toString()}-${file.originalname}`),
      })
    : multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          // Attach location for compatibility with resources.js upload handler
          file.location = `${req.protocol}://${req.get('host')}/api/uploads/${filename}`;
          cb(null, filename);
        },
      }),
});