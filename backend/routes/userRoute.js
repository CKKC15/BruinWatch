// user route

import express from 'express';
import { register, login, logout, updateUser, getAllVideos } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// register, login, logout
router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);

// update user
router.put('/:id', auth, updateUser);

// video funcs
router.get('/videos', auth, getAllVideos);

export default router;