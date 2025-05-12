import express from 'express';
import { chat } from '../controllers/chatbotController.js';

const router = express.Router();

// POST /chat/:videoId
router.post('/chat/:videoId', chat);

export default router;