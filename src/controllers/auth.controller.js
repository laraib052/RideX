// Path: src/controllers/auth.controller.js

const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const User          = require('../models/user.model');
const DriverProfile = require('../models/DriverProfile.model');// ⚠️ adjust path to your actual file
const AuthService   = require('../services/auth.service');
const { success, created } = require('../utils/response.util');

// ══════════════════════════════════════════════
// CLASS-BASED CONTROLLERS (Rider auth)
// ══════════════════════════════════════════════
class AuthController {

  // ── USER REGISTRATION (Rider) ──
  async register(req, res, next) {
    try {
      const user = await AuthService.registerUser(req.body);
      return created(
        res,
        user,
        'User registered successfully. Please verify your email.'
      );
    } catch (err) {
      next(err);
    }
  }

  // ── USER LOGIN ──
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginUser(email, password);
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  // ── GET PROFILE ──
  async getProfile(req, res, next) {
    try {
      return success(res, req.user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  }

  // ── UPDATE FCM TOKEN ──
  async updateFcmToken(req, res, next) {
    try {
      const { fcmToken } = req.body;
      await AuthService.updateFcmToken(req.user._id, fcmToken);
      return success(res, {}, 'FCM token updated');
    } catch (err) {
      next(err);
    }
  }
}

// ══════════════════════════════════════════════
// DRIVER REGISTRATION (standalone function)
// POST /api/auth/register/driver
// Uses multer — req.files contains uploaded docs
// ══════════════════════════════════════════════
const registerDriver = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      vehicleType,    // 'car' | 'rickshaw' | 'bike'
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehiclePlate,
      licenseNumber,
      licenseExpiry,
      cnicNumber,
    } = req.body;

    // ── Validate basic fields ──
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.',
      });
    }

    if (!vehicleType || !vehicleModel || !vehiclePlate) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle type, model, and plate number are required.',
      });
    }

    if (!licenseNumber || !licenseExpiry || !cnicNumber) {
      return res.status(400).json({
        success: false,
        message: 'License number, license expiry, and CNIC number are required.',
      });
    }

    // ── Validate uploaded files ──
    if (
      !req.files?.licensePhoto ||
      !req.files?.cnicFront    ||
      !req.files?.cnicBack
    ) {
      return res.status(400).json({
        success: false,
        message: 'License photo, CNIC front, and CNIC back are required.',
      });
    }

    // ── Check duplicate email/phone ──
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: exists.email === email
          ? 'Email already registered.'
          : 'Phone already registered.',
      });
    }

    // ── Check duplicate plate number ──
    const plateExists = await DriverProfile.findOne({ 'vehicle.plateNumber': vehiclePlate });
    if (plateExists) {
      return res.status(409).json({
        success: false,
        message: 'A driver with this plate number already exists.',
      });
    }

    // ── Hash password ──
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Build file URLs ──
    const baseUrl = process.env.BASE_URL
                  || 'https://web-production-bb3a9.up.railway.app';
    const licensePhoto = `${baseUrl}/uploads/${req.files.licensePhoto[0].filename}`;
    const cnicFront    = `${baseUrl}/uploads/${req.files.cnicFront[0].filename}`;
    const cnicBack     = `${baseUrl}/uploads/${req.files.cnicBack[0].filename}`;

    // ── Create User (auth record) ──
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'driver',
      isVerified: false,
    });

    // ── Create DriverProfile (vehicle + documents) ──
    let driverProfile;
    try {
      driverProfile = await DriverProfile.create({
        user: user._id,
        vehicle: {
          type:        vehicleType,
          make:        vehicleMake  || '',
          model:       vehicleModel,
          year:        vehicleYear  || new Date().getFullYear(),
          color:       vehicleColor || '',
          plateNumber: vehiclePlate,
        },
        licenseNumber,
        licenseExpiry,
        licensePhoto,
        cnicNumber,
        cnicFrontPhoto: cnicFront,
        cnicBackPhoto:  cnicBack,
        isVerified: false,
        verificationStatus: 'pending',
        isOnline: false,
      });
    } catch (profileErr) {
      // Rollback user creation if profile fails
      await User.findByIdAndDelete(user._id);
      throw profileErr;
    }

    // ── Issue JWT ──
    const token = jwt.sign(
      { id: user._id, role: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Driver registered. Documents sent for verification.',
      data: {
        token,
        user: {
          _id:   user._id,
          name:  user.name,
          email: user.email,
          phone: user.phone,
          role:  user.role,
        },
        driverProfile: {
          _id: driverProfile._id,
          vehicle: driverProfile.vehicle,
          verificationStatus: driverProfile.verificationStatus,
          isVerified: driverProfile.isVerified,
        },
      },
    });

  } catch (err) {
    console.error('registerDriver error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

// ══════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════
module.exports = new AuthController();
module.exports.registerDriver = registerDriver;