import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadSourceHandler,
  triggerScanHandler,
  listSourcesHandler,
  getSourceHandler,
  getFindingsHandler,
  getFlagsHandler,
} from './discovery.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Configure safe local private disk storage for uploaded spreadsheets
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.tenantId || 'general';
    const uploadDir = path.resolve(process.cwd(), 'uploads', tenantId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, sanitizedExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls', '.txt', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only .csv, .xlsx, .xls, .txt, and .pdf files are supported.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
});

// Protect all discovery endpoints with authentication and tenant isolation
router.use(authenticate, requireTenant);

// Endpoints
router.post('/upload', upload.single('file'), uploadSourceHandler);
router.post('/scan/:sourceId', triggerScanHandler);
router.get('/sources', listSourcesHandler);
router.get('/sources/:sourceId', getSourceHandler);
router.get('/sources/:sourceId/findings', getFindingsHandler);
router.get('/sources/:sourceId/flags', getFlagsHandler);

export default router;
