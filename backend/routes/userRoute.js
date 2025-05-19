// user route

import express from 'express';
import { register, login, logout, updateUser, getAllVideos, createVideo, getVideoById, updateVideo, deleteVideo } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
const upload = multer();

const router = express.Router();

// register, login, logout
router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);

// update user
router.put('/:id', auth, updateUser);

// video routes under user
router.post('/:id/videos', auth, upload.single('file'), createVideo);
router.get('/:id/videos', auth, getAllVideos);
router.get('/:id/videos/:videoId', auth, getVideoById);
router.put('/:id/videos/:videoId', auth, updateVideo);
router.delete('/:id/videos/:videoId', auth, deleteVideo);

// video routes moved to videoRoute.js

export default router;