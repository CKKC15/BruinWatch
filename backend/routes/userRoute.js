// user route

import express from 'express';
import { register, login, logout, getCurrentUser, verifyGoogle, updateUser, getAllVideos, createVideo, getVideoById, updateVideo, deleteVideo, createClass, getAllClasses, getClassById, updateClass, deleteClass, getAllClassNames, getAllVideosForClass, findKeywordInVideo } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
const upload = multer();

const router = express.Router();

// register, login, logout
router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);

// Google OAuth client-side verification
router.post('/verify', verifyGoogle);

// update user
router.put('/:id', auth, updateUser);

// class routes under user
router.post('/:id/create_class', auth, createClass);
router.get('/:id/get_classes', auth, getAllClasses);
router.get('/:id/classes/:classId', auth, getClassById);
router.put('/:id/classes/:classId', auth, updateClass);
router.delete('/:id/delete_class/:classId', auth, deleteClass);
router.get('/:id/classes/:classId/videos', auth, getAllVideosForClass);
// class name routes under user
router.get('/:id/classnames', auth, getAllClassNames);

// video routes under user
router.post('/:id/videos', auth, upload.single('file'), createVideo);
router.get('/:id/videos', auth, getAllVideos);
router.get('/:id/videos/:videoId', auth, getVideoById);
router.put('/:id/videos/:videoId', auth, updateVideo);
router.delete('/:id/videos/:videoId', auth, deleteVideo);
router.get('/:id/videos/search/:className', findKeywordInVideo);

// video routes moved to videoRoute.js

export default router;