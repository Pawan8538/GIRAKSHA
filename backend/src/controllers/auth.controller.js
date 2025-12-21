const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const {
  createUser,
  getUserByEmail,
  getUserByPhone,
  getRoleById,
  getRoleByName,
  getAllRoles,
  createGovAuthority,
  updateUserProfile,
  updateUserPassword,
  getUserById,
  createSlope,
  getAllSlopes,
  createDefaultSensors,
  createWorkerInvite,
  getWorkerInviteByPhone,
  markWorkerInviteRegistered,
  approveUser,
  rejectUser,
  getPendingUsers,
  getWorkersBySlope,
  updateUserDocs,
  deleteUser,
  getSlopeById
} = require('../models/queries');

/**
 * ===================================================================
 * UTILITY FUNCTIONS
 * ===================================================================
 */

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

const createToken = (user_id, email, role_id, slope_id) => {
  return jwt.sign(
    { sub: user_id, email, role_id, slope_id },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};

/**
 * ===================================================================
 * 1. FIELD WORKER REGISTRATION & LOGIN
 * ===================================================================
 */

exports.registerWorker = async (req, res, next) => {
  try {
    const { phone, name, password, otp } = req.body;

    // Validate OTP (demo: use 123456)
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check if phone already registered
    const existing = await getUserByPhone(phone);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Check if phone was invited
    const inviteRes = await getWorkerInviteByPhone(phone);
    if (inviteRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No valid invitation found for this mobile number. Please contact your Site Admin to receive an invite code. Invites expire after 15 minutes.'
      });
    }
    const invite = inviteRes.rows[0];

    // Get field_worker role
    const roles = await getAllRoles();
    const workerRole = roles.rows.find(r => r.name === 'field_worker');
    if (!workerRole) {
      throw new Error('field_worker role not found in database');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user (field workers are auto-approved)
    const newUserRes = await createUser(
      workerRole.id,
      name,
      `${phone}@worker.local`,
      phone,
      passwordHash,
      invite.slope_id
    );
    const newUser = newUserRes.rows[0];

    // Auto-approve field workers
    await approveUser(newUser.id);
    await markWorkerInviteRegistered(invite.id);

    // Generate token
    const token = createToken(newUser.id, newUser.email, newUser.role_id, newUser.slope_id);

    return res.status(201).json({
      success: true,
      message: 'Field worker registration successful',
      token,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role_id: newUser.role_id,
        role_name: 'field_worker',
        slope_id: newUser.slope_id,
        is_approved: true
      }
    });
  } catch (error) {
    console.error('[Auth] registerWorker error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 2. SITE ADMIN REGISTRATION & LOGIN
 * ===================================================================
 */

exports.registerSiteAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, company_id_url, slope_id } = req.body;

    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and phone are required' });
    }

    // slope_id is now required - site admins must select existing mine
    if (!slope_id) {
      return res.status(400).json({
        success: false,
        message: 'Mine selection is required. Contact Super Admin if mine doesn\'t exist.'
      });
    }

    // Check if email already exists
    const existing = await getUserByEmail(email);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Verify selected mine exists
    const slopeRes = await getSlopeById(slope_id);
    if (slopeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected mine not found' });
    }

    // Get site_admin role
    const roles = await getAllRoles();
    const adminRole = roles.rows.find(r => r.name === 'site_admin');
    if (!adminRole) {
      throw new Error('site_admin role not found in database');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user (pending approval)
    const newUserRes = await createUser(adminRole.id, name, email, phone, passwordHash, slope_id);
    const newUser = newUserRes.rows[0];

    // Store company ID document URL if provided
    if (company_id_url) {
      await updateUserDocs(newUser.id, null, company_id_url);
    }

    return res.status(201).json({
      success: true,
      message: 'Site Admin registration successful. Pending Super Admin approval.',
      data: {
        id: newUser.id,
        email: newUser.email,
        role_name: 'site_admin',
        approval_status: newUser.approval_status
      }
    });
  } catch (error) {
    console.error('[Auth] registerSiteAdmin error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 3. GOVERNMENT AUTHORITY REGISTRATION & LOGIN
 * ===================================================================
 */

exports.registerGov = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, govt_id_url, slope_ids } = req.body;

    // Validate input
    if (!name || !email || !password || !phone || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, password, phone, and department are required' });
    }

    // Check if email exists
    const existing = await getUserByEmail(email);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Get gov_authority role
    const roles = await getAllRoles();
    const govRole = roles.rows.find(r => r.name === 'gov_authority');
    if (!govRole) {
      throw new Error('gov_authority role not found in database');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Assign to a slope if provided
    const slopeId = (slope_ids && slope_ids.length > 0) ? slope_ids[0] : null;

    // Create user (pending approval)
    const newUserRes = await createUser(govRole.id, name, email, phone, passwordHash, slopeId);
    const newUser = newUserRes.rows[0];

    // Store govt ID document
    if (govt_id_url) {
      await updateUserDocs(newUser.id, govt_id_url, null);
    }

    // Create govt authority record
    await createGovAuthority(newUser.id, department, 'Default Region');

    return res.status(201).json({
      success: true,
      message: 'Government Authority registration successful. Pending Super Admin approval.',
      data: {
        id: newUser.id,
        email: newUser.email,
        role_name: 'gov_authority',
        approval_status: newUser.approval_status
      }
    });
  } catch (error) {
    console.error('[Auth] registerGov error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 4. LOGIN (All Profiles)
 * ===================================================================
 */

exports.login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    // Get user by email or phone
    let userResult;
    if (email) {
      userResult = await getUserByEmail(email);
    } else {
      userResult = await getUserByPhone(phone);
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get user role
    const roleResult = await getRoleById(user.role_id);
    const roleName = roleResult.rows.length > 0 ? roleResult.rows[0].name : null;

    // Check approval status (super_admin doesn't need approval)
    if (roleName !== 'super_admin' && !user.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval',
        approval_status: user.approval_status || 'pending'
      });
    }

    // Generate token
    const token = createToken(user.id, user.email, user.role_id, user.slope_id);

    return res.json({
      success: true,
      message: `${roleName} login successful`,
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: roleName,
        slope_id: user.slope_id,
        is_approved: user.is_approved
      }
    });
  } catch (error) {
    console.error('[Auth] login error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 5. PROFILE MANAGEMENT
 * ===================================================================
 */

exports.getProfile = async (req, res, next) => {
  try {
    const userResult = await getUserById(req.user.id);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = sanitizeUser(userResult.rows[0]);
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('[Auth] getProfile error:', error.message);
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    const userResult = await getUserById(req.user.id);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required to change password' });
      }

      const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await updateUserPassword(req.user.id, passwordHash);
    }

    // Update profile
    const updatedResult = await updateUserProfile(req.user.id, name, phone);
    const updatedUser = sanitizeUser(updatedResult.rows[0]);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('[Auth] updateProfile error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 6. WORKER INVITATION (Site Admin Only)
 * ===================================================================
 */

exports.inviteWorker = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const adminId = req.user.id;
    const slopeId = req.user.slope_id;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!slopeId) {
      return res.status(400).json({ success: false, message: 'Admin must be assigned to a mine' });
    }

    // Check if phone already invited
    const existingInvite = await getWorkerInviteByPhone(phone);
    if (existingInvite.rows.length > 0 && !existingInvite.rows[0].is_registered) {
      const otp = existingInvite.rows[0].otp || '123456';
      return res.json({
        success: true,
        message: `Phone number already invited. Use existing OTP.`,
        otp,
        existing: true
      });
    }

    // Create invite with OTP
    const result = await createWorkerInvite(phone, slopeId, adminId);
    const otp = result.rows[0]?.otp || '123456'; // Get OTP from database

    return res.json({
      success: true,
      message: `Invitation sent to ${phone}`,
      otp, // Return OTP to display to admin
      phone,
      existing: false
    });
  } catch (error) {
    console.error('[Auth] inviteWorker error:', error.message);
    next(error);
  }
};

/**
 * Direct Worker Creation (Site Admin)
 * Creates worker accounts directly without invite/OTP
 * Password = phone number, auto-approved
 */
exports.createWorkers = async (req, res, next) => {
  try {
    const { phones } = req.body; // Array of phone numbers or single string
    const adminId = req.user.id;
    const slopeId = req.user.slope_id;

    if (!slopeId) {
      return res.status(400).json({
        success: false,
        message: 'Admin must be assigned to a mine'
      });
    }

    // Convert to array if single phone provided
    const phoneArray = Array.isArray(phones) ? phones : [phones];

    if (!phoneArray || phoneArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one phone number is required'
      });
    }

    // Get field_worker role
    const roles = await getAllRoles();
    const workerRole = roles.rows.find(r => r.name === 'field_worker');
    if (!workerRole) {
      throw new Error('field_worker role not found in database');
    }

    const created = [];
    const errors = [];

    // Create workers
    for (const phone of phoneArray) {
      try {
        // Check if phone already exists
        const existing = await getUserByPhone(phone);
        if (existing.rows.length > 0) {
          errors.push({ phone, error: 'Phone number already registered' });
          continue;
        }

        // Password = phone number
        const passwordHash = await bcrypt.hash(phone, 10);
        const name = `Worker ${phone.slice(-4)}`; // Default name: Worker 9999

        // Create user - auto-approved
        const newUserRes = await createUser(
          workerRole.id,
          name,
          `${phone}@worker.local`, // generate dummy email
          phone,
          passwordHash,
          slopeId
        );

        const newUser = newUserRes.rows[0];

        // Auto-approve
        await approveUser(newUser.id);

        created.push({
          id: newUser.id,
          phone,
          name,
          password: phone, // Return password for admin to share
          approved: true
        });

      } catch (error) {
        errors.push({ phone, error: error.message });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Created ${created.length} worker(s)`,
      data: {
        created,
        errors,
        total: phoneArray.length,
        success_count: created.length,
        error_count: errors.length
      }
    });
  } catch (error) {
    console.error('[Auth] createWorkers error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 7. SUPER ADMIN FUNCTIONS
 * ===================================================================
 */

exports.listPendingUsers = async (req, res, next) => {
  try {
    const result = await getPendingUsers();
    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('[Auth] listPendingUsers error:', error.message);
    next(error);
  }
};

exports.approveUserRequest = async (req, res, next) => {
  try {
    // Support both snake_case (legacy) and camelCase (modern)
    const user_id = req.body.user_id || req.body.userId;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await approveUser(user_id);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'User approved successfully',
      data: sanitizeUser(result.rows[0])
    });
  } catch (error) {
    console.error('[Auth] approveUserRequest error:', error.message);
    next(error);
  }
};

exports.rejectUserRequest = async (req, res, next) => {
  try {
    const user_id = req.body.user_id || req.body.userId;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await rejectUser(user_id);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'User rejected successfully',
      data: sanitizeUser(result.rows[0])
    });
  } catch (error) {
    console.error('[Auth] rejectUserRequest error:', error.message);
    next(error);
  }
};

exports.listWorkers = async (req, res, next) => {
  try {
    const slopeId = req.user.slope_id;

    if (!slopeId) {
      return res.status(400).json({ success: false, message: 'Must be assigned to a mine' });
    }

    const result = await getWorkersBySlope(slopeId);
    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('[Auth] listWorkers error:', error.message);
    next(error);
  }
};

exports.deleteWorker = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Worker ID is required' });
    }

    const result = await deleteUser(id);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    return res.json({
      success: true,
      message: 'Worker deleted successfully'
    });
  } catch (error) {
    console.error('[Auth] deleteWorker error:', error.message);
    next(error);
  }
};

exports.getPendingInvites = async (req, res, next) => {
  try {
    const slopeId = req.user.slope_id;

    if (!slopeId) {
      return res.status(400).json({ success: false, message: 'Admin must be assigned to a mine' });
    }

    // Get all invites for this slope/mine
    const result = await pool.query(`
      SELECT id, phone, otp, is_registered, created_at 
      FROM worker_invites 
      WHERE slope_id = $1 
      ORDER BY created_at DESC
    `, [slopeId]);

    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('[Auth] getPendingInvites error:', error.message);
    next(error);
  }
};

/**
 * ===================================================================
 * 8. UTILITY ENDPOINTS
 * ===================================================================
 */

exports.listRoles = async (req, res, next) => {
  try {
    const result = await getAllRoles();
    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('[Auth] listRoles error:', error.message);
    next(error);
  }
};

exports.getSlopes = async (req, res, next) => {
  try {
    const result = await getAllSlopes();
    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('[Auth] getSlopes error:', error.message);
    next(error);
  }
};
