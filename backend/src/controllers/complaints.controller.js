const fs = require('fs');
const path = require('path');
const multer = require('multer');

const {
  createComplaint,
  getComplaintsByUser,
  getAllComplaints,
  updateComplaintStatus,
  addComplaintMedia,
  getComplaintMedia,
  addComplaintFeedback,
  getComplaintFeedback,
  getComplaintById,
  getUsersByRole
} = require('../models/queries');
const { notifyUser, notifyUsers } = require('../services/notification.service');

const uploadsDir = path.join(__dirname, '../../uploads/complaints');

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

const uploadEvidence = [
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const relativePath = path
      .relative(path.join(__dirname, '../..'), req.file.path)
      .replace(/\\/g, '/');

    return res.json({
      success: true,
      data: {
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/${relativePath}`
      }
    });
  }
];

const mapComplaintDetails = async (complaint) => {
  const [media, feedback] = await Promise.all([
    getComplaintMedia(complaint.id),
    getComplaintFeedback(complaint.id)
  ]);
  return {
    ...complaint,
    media: media.rows,
    feedback: feedback.rows
  };
};

const createComplaintController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { slopeId, description, mediaUrls = [], mediaUrl = null } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User id required'
      });
    }

    const created = await createComplaint(
      userId,
      slopeId,
      description,
      Array.isArray(mediaUrls) ? mediaUrls[0] || mediaUrl : mediaUrl || null
    );

    const attachments = Array.isArray(mediaUrls)
      ? mediaUrls
      : mediaUrl
        ? [mediaUrl]
        : [];

    await Promise.all(
      attachments.map((url) => addComplaintMedia(created.rows[0].id, url))
    );

    const detailed = await mapComplaintDetails(created.rows[0]);

    const siteAdmins = await getUsersByRole('site_admin');
    await notifyUsers(
      req.app,
      siteAdmins.rows.map((user) => user.id),
      {
        type: 'complaint',
        title: 'New complaint submitted',
        body: description?.slice(0, 120) || 'New field report received',
        metadata: { complaintId: created.rows[0].id }
      }
    );

    return res.status(201).json({
      success: true,
      data: detailed
    });
  } catch (error) {
    next(error);
  }
};

const listComplaints = async (req, res, next) => {
  try {
    let complaints;
    if (req.user && ['site_admin', 'super_admin', 'gov_authority'].includes(req.user.role_name)) {
      complaints = await getAllComplaints();
    } else {
      complaints = await getComplaintsByUser(req.user.id);
    }

    const detailed = await Promise.all(complaints.rows.map(mapComplaintDetails));

    return res.json({
      success: true,
      data: detailed
    });
  } catch (error) {
    next(error);
  }
};

const getComplaintDetail = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const complaint = await getComplaintById(complaintId);

    if (
      complaint.rowCount === 0 ||
      (
        req.user.role_name === 'field_worker' &&
        complaint.rows[0].user_id !== req.user.id
      )
    ) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const detailed = await mapComplaintDetails(complaint.rows[0]);
    return res.json({
      success: true,
      data: detailed
    });
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatusController = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    const complaint = await getComplaintById(complaintId);
    if (complaint.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const updated = await updateComplaintStatus(complaintId, status);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await addComplaintFeedback(
      complaintId,
      req.user.id,
      complaint.rows[0].user_id,
      `Status changed to ${status}`,
      'status'
    );

    if (complaint.rows[0].user_id) {
      await notifyUser(req.app, {
        userId: complaint.rows[0].user_id,
        type: 'complaint',
        title: 'Complaint updated',
        body: `Your complaint is now ${status}`,
        metadata: { complaintId }
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const addComplaintFeedbackController = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const complaint = await getComplaintById(complaintId);
    if (complaint.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const feedback = await addComplaintFeedback(
      complaintId,
      req.user.id,
      complaint.rows[0].user_id,
      message,
      'feedback'
    );

    if (complaint.rows[0].user_id) {
      await notifyUser(req.app, {
        userId: complaint.rows[0].user_id,
        type: 'complaint',
        title: 'Feedback received',
        body: message,
        metadata: { complaintId }
      });
    }

    return res.status(201).json({
      success: true,
      data: feedback.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadEvidence,
  createComplaint: createComplaintController,
  listComplaints,
  getComplaintDetail,
  updateComplaintStatus: updateComplaintStatusController,
  addFeedback: addComplaintFeedbackController
};
