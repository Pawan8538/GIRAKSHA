const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  createUser,
  getUserByEmail,
  getUserByPhone,
  getRoleById,
  getRoleByName,
  getUsersCount,
  createGovAuthority,
  getGovAuthorityByUser,
  updateUserProfile,
  updateUserPassword,
  getUserById,
  createSlope,
  getAllSlopes,
  createDefaultSensors,
  getAllRoles,
  createWorkerInvite,
  getWorkerInviteByPhone,
  markWorkerInviteRegistered,
  approveUser,
  rejectUser,
  getPendingUsers,
  getWorkersBySlope,
  updateUserDocs,
  updateUserDepartment
} = require('../models/queries');
const config = require('../config/env');

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

const PUBLIC_ROLES = ['site_admin', 'field_worker', 'gov_authority'];

const registerGov = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, govt_id_url, slope_ids } = req.body;

    // Phone is now the unique identifier
    const existing = await getUserByPhone(phone);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const roles = await getAllRoles();
    const govRole = roles.rows.find(r => r.name === 'gov_authority');
    if (!govRole) throw new Error('gov_authority role not found');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const slopeId = slope_ids && slope_ids.length > 0 ? slope_ids[0] : null;

    // Email can be null
    const newUserRes = await createUser(govRole.id, name, email || null, phone, hash, slopeId);
    const newUser = newUserRes.rows[0];

    // await updateUserDocs(newUser.id, govt_id_url, null);
    // await updateUserDepartment(newUser.id, department);

    await createGovAuthority(newUser.id, department, 'Default Region');

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Pending Super Admin approval.',
      data: { id: newUser.id, phone: newUser.phone, email: newUser.email }
    });
  } catch (error) {
    next(error);
  }
};

const registerSiteAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await getUserByPhone(phone);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const roles = await getAllRoles();
    const adminRole = roles.rows.find(r => r.name === 'site_admin');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Site Admin registers without a mine - Super Admin will assign later
    const newUserRes = await createUser(adminRole.id, name, email || null, phone, hash, null);
    const newUser = newUserRes.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Pending Super Admin approval.',
      data: { id: newUser.id, phone: newUser.phone, email: newUser.email }
    });
  } catch (error) {
    next(error);
  }
};

const inviteWorker = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const { id: adminId, slope_id } = req.user;

    if (!slope_id) {
      return res.status(400).json({ success: false, message: 'Admin not assigned to a mine' });
    }

    await createWorkerInvite(phone, slope_id, adminId);

    return res.json({ success: true, message: `Invitation sent to ${phone}` });
  } catch (error) {
    next(error);
  }
};

const registerWorker = async (req, res, next) => {
  try {
    const { phone, name, password, otp } = req.body;

    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const inviteRes = await getWorkerInviteByPhone(phone);
    if (inviteRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Number not invited. Contact Site Admin.' });
    }
    const invite = inviteRes.rows[0];

    const existing = await getUserByPhone(phone);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Worker already registered' });
    }

    const roles = await getAllRoles();
    const workerRole = roles.rows.find(r => r.name === 'field_worker');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUserRes = await createUser(workerRole.id, name, null, phone, hash, invite.slope_id);
    const newUser = newUserRes.rows[0];

    await approveUser(newUser.id);
    await markWorkerInviteRegistered(invite.id);

    const token = jwt.sign(
      { sub: newUser.id, phone: newUser.phone, role_id: newUser.role_id, slope_id: newUser.slope_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Worker registration successful',
      token,
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    let result;
    if (phone) {
      result = await getUserByPhone(phone);
    } else if (email) {
      // Keep email login as fallback
      result = await getUserByEmail(email);
    } else {
      return res.status(400).json({ success: false, message: 'Phone or Email required' });
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const roles = await getAllRoles();
    const superAdminRole = roles.rows.find(r => r.name === 'super_admin');

    if (user.role_id !== superAdminRole.id && !user.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval',
        approval_status: user.approval_status
      });
    }

    const token = jwt.sign(
      { sub: user.id, phone: user.phone, email: user.email, role_id: user.role_id, slope_id: user.slope_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const role = roles.rows.find((r) => r.id === user.role_id);
    user.role_name = role ? role.name : null;

    // Fetch department for gov_authority users
    let department = null;
    if (role && role.name === 'gov_authority') {
      const govAuthResult = await getGovAuthorityByUser(user.id);
      if (govAuthResult.rows.length > 0) {
        department = govAuthResult.rows[0].department;
      }
    }

    return res.json({
      success: true,
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: user.role_name,
        slope_id: user.slope_id,
        is_approved: user.is_approved,
        department: department
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userResult = await getUserById(req.user.id);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = sanitizeUser(userResult.rows[0]);

    // Fetch role and department for gov_authority users
    const roleResult = await getRoleById(user.role_id);
    if (roleResult.rows.length > 0) {
      user.role_name = roleResult.rows[0].name;

      if (roleResult.rows[0].name === 'gov_authority') {
        const govAuthResult = await getGovAuthorityByUser(user.id);
        if (govAuthResult.rows.length > 0) {
          user.department = govAuthResult.rows[0].department;
        }
      }
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name = null, phone = null, currentPassword = null, newPassword = null } = req.body;

    const userResult = await getUserById(req.user.id);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required' });
      }
      const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await updateUserPassword(req.user.id, passwordHash);
    }

    const updatedProfile = await updateUserProfile(req.user.id, name, phone);
    const updatedUser = sanitizeUser(updatedProfile.rows[0]);

    return res.json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();
    return res.json({ success: true, data: roles.rows });
  } catch (error) {
    next(error);
  }
};

const listPendingUsers = async (req, res, next) => {
  try {
    const result = await getPendingUsers();
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const approveUserRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await approveUser(userId);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, message: 'User approved', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const rejectUserRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await rejectUser(userId);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, message: 'User rejected', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const listWorkers = async (req, res, next) => {
  try {
    const { slope_id } = req.user;
    if (!slope_id) {
      return res.status(400).json({ success: false, message: 'User not assigned to a mine' });
    }
    const result = await getWorkersBySlope(slope_id);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getSlopes = async (req, res, next) => {
  try {
    const result = await getAllSlopes();
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const deleteWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slope_id } = req.user;
    const { getUserById, deleteUser } = require('../models/queries');

    // 1. Check if worker exists and belongs to the same mine
    const workerRes = await getUserById(id);
    if (workerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    const worker = workerRes.rows[0];

    if (worker.slope_id !== slope_id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this worker' });
    }

    // 2. Delete worker
    await deleteUser(id);

    return res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerGov,
  registerSiteAdmin,
  registerWorker,
  inviteWorker,
  login,
  getProfile,
  listRoles,
  updateProfile,
  listPendingUsers,
  approveUserRequest,
  rejectUserRequest,
  listWorkers,
  getSlopes,
  deleteWorker
};
