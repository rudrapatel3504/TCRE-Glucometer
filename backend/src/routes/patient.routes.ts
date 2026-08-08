import { Router } from 'express';
import * as controller from '../controllers/patient.controller';

const router = Router();

router.get('/', controller.getPatients);
router.post('/', controller.ingestMeasurements);
router.delete('/', controller.deletePatientOrMeasurement);

export default router;
