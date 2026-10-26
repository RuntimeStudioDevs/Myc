import { Router } from 'express';
import { handleAgentChat } from '../modules/ai-agent/ai-agent.controller';

const router = Router();

// Módulo AI Agent
router.post('/agent/chat', handleAgentChat);

export default router;
