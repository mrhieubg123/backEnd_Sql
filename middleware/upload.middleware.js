import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { ensureDirSync } from '../utils/fs.js';

dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
ensureDirSync(UPLOAD_DIR);

// cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeBase = base.replace(/[^\w\-]+/g, '_');
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  }
});

// chỉ cho phép một số loại (optional)
function fileFilter(req, file, cb) {
  // ví dụ: cho tất cả → cb(null, true)
  // nếu muốn chặn: cb(new Error('Invalid mime'), false)
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 20_000_000) }
});

// expose đường dẫn thư mục cho controller dùng khi trả URL
export { UPLOAD_DIR };
