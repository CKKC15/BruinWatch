// user route

import express from 'express';
import { register, login, logout, getCurrentUser, verifyGoogle, updateUser, getAllVideos, createVideo, getVideoById, updateVideo, deleteVideo, createClass, getAllClasses, getClassById, updateClass, deleteClass, getAllClassNames, getAllVideosForClass, findKeywordInVideo, joinClass, joinClassFromData, debugDatabase } from '../controllers/userController.js';
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
router.get('/:id/classes/:classId/videos', getAllVideosForClass);
router.get('/:id/classnames', auth, getAllClassNames);
router.post('/:id/join/:classId', auth, joinClass);
router.post('/:id/join_class', auth, joinClassFromData);

// video routes under user
router.post('/:id/videos', auth, upload.single('file'), createVideo);
router.get('/:id/videos', auth, getAllVideos);
router.get('/:id/videos/:videoId', getVideoById);
router.put('/:id/videos/:videoId', auth, updateVideo);
router.delete('/:id/videos/:videoId', auth, deleteVideo);
router.get('/:id/videos/search/:className', auth, findKeywordInVideo);

// DEBUG: Check database contents
router.get('/:id/debug', auth, debugDatabase);

// video routes moved to videoRoute.js

export default router;