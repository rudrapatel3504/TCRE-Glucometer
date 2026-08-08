import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/analysis.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/analyze', controller.analyze);
router.post('/upload-csv', upload.single('file'), controller.uploadCsv);

export default router;
