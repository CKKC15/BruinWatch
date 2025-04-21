// video route

import express from 'express';
import { createVideo, getVideoById, updateVideo, deleteVideo } from '../controllers/videoController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// video funcs

router.post('/', auth, createVideo);
router.get('/:id', getVideoById);
router.put('/:id', auth, updateVideo);
router.delete('/:id', auth, deleteVideo);

export default router;