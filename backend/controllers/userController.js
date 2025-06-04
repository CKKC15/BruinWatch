// user controller

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Class from "../models/class.js";
import Video from "../models/video.js";
import {
  verifyGoogleToken,
  findOrCreateGoogleUser,
} from "../service/googleAuth.js";
import {
  createVideoRecord,
  fetchAllVideos,
  fetchVideoById,
  updateVideoRecord,
  deleteVideoRecord,
} from "./videoController.js";
import { uploadFileToS3 } from "../service/awsUpload.js";
import {
  createClassRecord,
  fetchAllClasses,
  fetchClassById,
  updateClassRecord,
  deleteClassRecord,
  fetchAllClassesNames,
  fetchAllVideosFromClass,
} from "./classController.js";
import { transcribeMedia } from "../service/transcript.js";
import { createEmbeddings } from "../service/embedding.js";
import ytdl from "ytdl-core";
import { convertYouTubeToMP4 } from "../service/youtubeConversion.js";

// register and login user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePictureIndex: user.profilePictureIndex
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePictureIndex: user.profilePictureIndex
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// logout user
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

// get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// verify Google token and authenticate user
export const verifyGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify the Google token
    const payload = await verifyGoogleToken(credential);

    // Find or create user based on Google profile
    const user = await findOrCreateGoogleUser(payload);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return user info and token
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePictureIndex: user.profilePictureIndex,
        picture: user.picture || payload.picture,
      },
    });
  } catch (err) {
    console.error("Google verification error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

// update user info (by ID)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, profilePictureIndex } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 12);
    if (profilePictureIndex) updates.profilePictureIndex = profilePictureIndex;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profilePictureIndex: user.profilePictureIndex
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch all videos
export const getAllVideos = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const videos = await fetchAllVideos(userId);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const findKeywordInVideo = async (req, res) => {
  try {
    const { id: userId, className } = req.params;
    const { keyword } = req.query;

    if (!className || !keyword) {
      return res.status(400).json({ message: "Missing className or keyword" });
    }

    const videos = await Video.find({ className, user: userId });
    const lowerKeyword = keyword.toLowerCase();

    const results = [];

    for (const video of videos) {
      const { transcript } = video;

      // Only proceed if transcript has segments
      if (Array.isArray(transcript?.segments)) {
        const matchingSegments = transcript.segments.filter(
          (seg) =>
            typeof seg.text === "string" &&
            seg.text.toLowerCase().includes(lowerKeyword)
        );

        if (matchingSegments.length > 0) {
          results.push({
            video,
            matchedSegments: matchingSegments,
          });
        }
      } else if (
        transcript?.fullText &&
        transcript.fullText.toLowerCase().includes(lowerKeyword)
      ) {
        // Fallback if only fullText is present
        results.push({
          video,
          matchedSegments: [
            { text: "Keyword found in fullText (no segments available)" },
          ],
        });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// create a new video and link to user and class
export const createVideo = async (req, res) => {
  try {
    console.log('Creating video with data:', {
      ...req.body,
      hasFile: !!req.file,
      userId: req.params.id
    });

    const { title, className, date, youtubeUrl } = req.body;
    const { id: userId } = req.params;

    if (!title || (!req.file && !youtubeUrl)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1. Find the class by name
    const classRecord = await Class.findOne({ name: className });
    if (!classRecord) {
      return res.status(404).json({ message: "Class not found " + className });
    }

    let videoUrl;
    let transcript;
    let embeddings;

    if (youtubeUrl) {
      console.log('Processing YouTube video:', youtubeUrl);

      // Validate YouTube URL
      if (!ytdl.validateURL(youtubeUrl)) {
        console.log('Invalid YouTube URL:', youtubeUrl);
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      try {
        // Download YouTube video and convert to MP4 buffer
        console.log('Starting YouTube video download and conversion');
        const videoBuffer = await convertYouTubeToMP4(youtubeUrl);
        console.log('Video conversion completed, buffer size:', videoBuffer.length);

        // Create a file object that matches the structure of uploaded files
        const fakeFile = {
          buffer: videoBuffer,
          originalname: `video_${Date.now()}.mp4`,
          mimetype: 'video/mp4'
        };

        // Process the video the same way as a direct upload
        console.log('Uploading video to S3');
        videoUrl = await uploadFileToS3(fakeFile, "videos");
        console.log('Video uploaded to S3:', videoUrl);
        transcript = await transcribeMedia(videoBuffer);
        embeddings = await createEmbeddings(transcript.segments);
        console.log('Video processing completed');
      } catch (error) {
        console.error("Error processing YouTube video:", error);
        return res.status(500).json({ message: "Failed to process YouTube video", details: error.message });
      }
    } else {
      // Handle direct file upload
      console.log('Processing uploaded file');
      videoUrl = await uploadFileToS3(req.file, "videos");
      transcript = await transcribeMedia(req.file.buffer);
      embeddings = await createEmbeddings(transcript.segments);
      console.log('File processing completed');
    }

    console.log('Creating video record');
    // Create video record with transcript
    const video = await createVideoRecord({
      title,
      link: videoUrl,
      transcript,
      embeddings,
      userId,
      className,
      date
    });

    console.log('Linking video to user and class');
    // Link video to user
    await User.findByIdAndUpdate(userId, {
      $push: { videos: video._id },
    });

    // Link video to class
    await Class.findByIdAndUpdate(classRecord._id, {
      $push: { videos: video._id },
    });

    console.log('Video creation completed successfully');
    res.status(201).json(video);
  } catch (err) {
    console.error("Error in createVideo:", err);
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// fetch single video
export const getVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Simply find the video by ID, no user ownership check
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update video
export const updateVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const updatedData = req.body;
    const video = await updateVideoRecord(userId, videoId, updatedData);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// delete video and unlink from user
export const deleteVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const video = await deleteVideoRecord(userId, videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });
    await User.findByIdAndUpdate(userId, { $pull: { videos: videoId } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch all classes for a user
export const getAllClasses = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { all } = req.query; // Check for 'all' query parameter

    if (all === 'true') {
      // Return all classes in the system
      const allClasses = await Class.find({});
      return res.json(allClasses);
    }

    // Return user's classes (existing behavior)
    const user = await User.findById(userId).populate('classes');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// create a new class and link to user
export const createClass = async (req, res) => {
  try {
    const { name, professor, term, color } = req.body;
    const { id: userId } = req.params;
    if (!name) return res.status(400).json({ message: "Missing fields" });
    const newClass = await createClassRecord({ name, professor, term, color });
    await User.findByIdAndUpdate(userId, { $push: { classes: newClass._id } });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch a single class
export const getClassById = async (req, res) => {
  try {
    const { id: userId, classId } = req.params;
    const classObj = await fetchClassById(classId);
    if (!classObj) return res.status(404).json({ message: "Class not found" });
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update class
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const updatedData = req.body;
    const classObj = await updateClassRecord(classId, updatedData);
    if (!classObj) return res.status(404).json({ message: "Class not found" });
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id: userId, classId } = req.params;

    // First, get the class so we can access its name
    const classObj = await deleteClassRecord(classId);
    if (!classObj) return res.status(404).json({ message: "Class not found" });

    // Find all videos by user for this class name
    const videos = await Video.find({
      className: classObj.name,
      user: userId,
    });

    // Delete all matching videos
    for (const video of videos) {
      await Video.findByIdAndDelete(video._id);
      await User.findByIdAndUpdate(userId, {
        $pull: { videos: video._id },
      });
    }

    // Unlink the class from the user
    await User.findByIdAndUpdate(userId, {
      $pull: { classes: classObj._id },
    });

    res.json({ message: "Class and related videos deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// fetch all class names for a user
export const getAllClassNames = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId).populate("classes", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const classNames = user.classes.map((cls) => cls.name);
    res.json(classNames);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch all videos for a class
export const getAllVideosForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log('Fetching videos for class ID:', classId);

    // Find the class and populate with full video details
    const classData = await Class.findById(classId).populate('videos');
    if (!classData) {
      console.log('Class not found:', classId);
      return res.status(404).json({ message: "Class not found" });
    }

    console.log('Class found:', classData.name);
    console.log('Videos in class.videos array:', classData.videos.length);

    // Try multiple approaches to find videos:

    // 1. Videos directly linked to the class (via videos array)
    let allVideos = [...classData.videos];

    // 2. Videos by exact className match
    const videosByExactName = await Video.find({ className: classData.name });

    // 3. Videos by partial className match (e.g., "CS31" matches "CS31: Introduction...")
    const classCode = classData.name.split(':')[0].trim(); // Extract "CS31" from "CS31: Introduction..."
    const videosByPartialName = await Video.find({
      className: { $regex: classCode, $options: 'i' }
    });

    console.log('Videos by exact className:', videosByExactName.length);
    console.log('Videos by partial className (code):', videosByPartialName.length);

    // Combine all videos and remove duplicates (based on _id)
    const videoMap = new Map();

    // Add videos from class.videos array
    allVideos.forEach(video => {
      videoMap.set(video._id.toString(), video);
    });

    // Add videos found by className
    videosByExactName.forEach(video => {
      videoMap.set(video._id.toString(), video);
    });

    // Add videos found by partial match
    videosByPartialName.forEach(video => {
      videoMap.set(video._id.toString(), video);
    });

    const uniqueVideos = Array.from(videoMap.values());

    console.log('Total unique videos found:', uniqueVideos.length);
    console.log('Video titles:', uniqueVideos.map(v => v.title));

    res.json(uniqueVideos);
  } catch (err) {
    console.error('Error in getAllVideosForClass:', err);
    res.status(500).json({ message: err.message });
  }
};

// join a class and link to user
export const joinClass = async (req, res) => {
  try {
    const { id: userId, classId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if user is already in this class
    const isAlreadyJoined = user.classes.some(cls => cls.toString() === classId);
    if (isAlreadyJoined) {
      return res.status(400).json({ message: "Already joined this class" });
    }

    // Add class to user's classes
    await User.findByIdAndUpdate(
      userId,
      { $push: { classes: classId } },
      { new: true }
    );

    res.status(200).json({
      message: "Successfully joined class",
      class: classExists
    });

  } catch (err) {
    console.error("Join class error:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// join a class by creating it from hardcoded data
export const joinClassFromData = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { code, name, professor, term } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has a class with this code and professor and term
    const existingClasses = await Class.find({
      _id: { $in: user.classes }
    });

    const alreadyJoined = existingClasses.some(cls =>
      cls.name === name && cls.professor === professor && cls.term === term
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "Already joined this class with this professor and term" });
    }

    // Create a new class with the provided data
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newClass = await createClassRecord({
      name: `${code}: ${name}`,
      professor,
      term,
      color: randomColor
    });

    // Add class to user's classes
    await User.findByIdAndUpdate(
      userId,
      { $push: { classes: newClass._id } },
      { new: true }
    );

    res.status(201).json({
      message: "Successfully joined class",
      class: newClass
    });

  } catch (err) {
    console.error("Join class from data error:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// DEBUG: endpoint to check database contents
export const debugDatabase = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Get user with populated classes
    const user = await User.findById(userId).populate('classes');

    // Get all videos for this user
    const userVideos = await Video.find({ user: userId });

    // Get all classes in the system
    const allClasses = await Class.find({});

    // Get all videos in the system
    const allVideos = await Video.find({});

    const debugInfo = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        classesCount: user.classes.length,
        videosCount: user.videos.length
      },
      userClasses: user.classes.map(cls => ({
        id: cls._id,
        name: cls.name,
        professor: cls.professor,
        term: cls.term,
        videosInArray: cls.videos.length
      })),
      userVideos: userVideos.map(video => ({
        id: video._id,
        title: video.title,
        className: video.className,
        date: video.date
      })),
      systemSummary: {
        totalClasses: allClasses.length,
        totalVideos: allVideos.length
      },
      allClassNames: allClasses.map(cls => cls.name),
      allVideoClassNames: [...new Set(allVideos.map(v => v.className))]
    };

    res.json(debugInfo);
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ message: err.message });
  }
};