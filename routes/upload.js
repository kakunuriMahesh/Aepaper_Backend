const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Only JPG, PNG, WebP, and PDF are accepted.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadToCloudinary = (fileBuffer, originalName, folder) => {
  return new Promise((resolve, reject) => {
    const isPdf = originalName.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'image';

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const CMS_FOLDER = 'cms-admin-panel';

router.post('/', auth, authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, `${CMS_FOLDER}/uploads`);

    const isPdf = req.file.originalname.toLowerCase().endsWith('.pdf');
    const fileType = isPdf ? 'PDF' : req.file.mimetype.split('/')[1].toUpperCase();

    return res.status(201).json({
      success: true,
      data: {
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        publicId: result.public_id,
      },
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

router.post('/multiple', auth, authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map((f) => uploadToCloudinary(f.buffer, f.originalname, `${CMS_FOLDER}/uploads`));
    const results = await Promise.all(uploadPromises);

    const files = results.map((r, i) => {
      const f = req.files[i];
      const isPdf = f.originalname.toLowerCase().endsWith('.pdf');
      return {
        fileUrl: r.secure_url,
        fileName: f.originalname,
        fileType: isPdf ? 'PDF' : f.mimetype.split('/')[1].toUpperCase(),
        fileSize: f.size,
        publicId: r.public_id,
      };
    });

    return res.status(201).json({ success: true, data: files });
  } catch (err) {
    console.error('Multi upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

router.delete('/:publicId', auth, authorize('TENANT_ADMIN', 'EDITOR'), async (req, res) => {
  try {
    const { publicId } = req.params;
    const decoded = decodeURIComponent(publicId);
    const isPdf = decoded.toLowerCase().endsWith('.pdf');
    await cloudinary.uploader.destroy(decoded, { resource_type: isPdf ? 'raw' : 'image' });
    return res.status(200).json({ success: true, message: 'File deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
