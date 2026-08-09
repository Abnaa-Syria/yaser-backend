import { Router } from 'express';
import * as webhookController from './payment-webhook.controller.js';

const router = Router();

router.post('/payments/:provider', webhookController.handlePaymentWebhook);

export default router;
