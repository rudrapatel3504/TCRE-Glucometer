import { Router } from 'express';
import * as controller from '../controllers/device.controller';

const router = Router();

router.get('/status', controller.getDeviceStatus);
router.post('/status', controller.updateDeviceStatus);
router.post('/trigger', controller.triggerImport);
router.post('/upload', controller.uploadRecords);

export default router;
