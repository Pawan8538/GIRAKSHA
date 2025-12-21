const fs = require('fs');
const path = require('path');
const multer = require('multer');

const {
  createAdvisory,
  addAdvisoryAttachment,
  getAdvisories,
  getAdvisoryAttachments,
  getUsersByRole
} = require('../models/queries');
const { notifyUsers } = require('../services/notification.service');

const uploadsDir = path.join(__dirname, '../../uploads/advisories');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});

const upload = multer({ storage });

const serializeAdvisory = async (advisory) => {
  const attachments = await getAdvisoryAttachments(advisory.id);
  return {
    ...advisory,
    attachments: attachments.rows
  };
};

const postAdvisory = async (req, res, next) => {
  try {
    const { slopeId = null, title, message, severity = 'info', targetSiteAdminId = null } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const advisoryResult = await createAdvisory(
      req.user.id,
      targetSiteAdminId || null,
      slopeId || null,
      title,
      message,
      severity,
      null
    );

    const advisory = advisoryResult.rows[0];

    if (Array.isArray(req.files)) {
      await Promise.all(
        req.files.map((file) => {
          const relativePath = path
            .relative(path.join(__dirname, '../..'), file.path)
            .replace(/\\/g, '/');
          return addAdvisoryAttachment(advisory.id, `/${relativePath}`, file.mimetype);
        })
      );
    }

    let recipients = [];
    if (targetSiteAdminId) {
      recipients = [Number(targetSiteAdminId)];
    } else if (slopeId) {
      // Notify all users associated with this mine/slope
      const { getUsersBySlope } = require('../models/queries');
      const slopeUsers = await getUsersBySlope(slopeId);
      recipients = slopeUsers.rows.map((user) => user.id);
    } else {
      // If no slope specified, notify all site admins
      const siteAdmins = await getUsersByRole('site_admin');
      recipients = siteAdmins.rows.map((user) => user.id);
    }

    await notifyUsers(req.app, recipients, {
      type: 'advisory',
      title,
      body: message,
      metadata: {
        advisoryId: advisory.id,
        severity,
        slopeId
      }
    });

    const serialized = await serializeAdvisory(advisory);
    return res.status(201).json({
      success: true,
      data: serialized
    });
  } catch (error) {
    next(error);
  }
};

const getAdvisoriesController = async (req, res, next) => {
  try {
    const { siteAdminId = null } = req.query;
    const advisories = await getAdvisories({
      siteAdminId: siteAdminId || (req.user.role_name === 'site_admin' ? req.user.id : null),
      authorId: req.user.role_name === 'gov_authority' ? req.user.id : null
    });

    const serialized = await Promise.all(advisories.rows.map(serializeAdvisory));
    return res.json({
      success: true,
      data: serialized
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  postAdvisory,
  getAdvisories: getAdvisoriesController
};
