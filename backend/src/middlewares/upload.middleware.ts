import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF, DOC, DOCX, and TXT are supported.'));
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const audioFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.m4a', '.mp3', '.wav', '.webm', '.ogg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only Audio files are supported.'));
  }
};

export const uploadAudio = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname) || '.m4a';
      cb(null, `audio-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: audioFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for audio
  },
});

const avatarDir = path.join(uploadDir, 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only image files (PNG, JPG, JPEG, WEBP) are supported for avatars.'));
  }
};

export const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: avatarFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for high-res images
  },
});

