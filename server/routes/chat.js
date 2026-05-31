import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Chatbot endpoint (public)
router.post('/', handleChat);

export default router;
