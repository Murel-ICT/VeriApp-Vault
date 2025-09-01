const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query, run } = require('../config/database');
const { logAuditEvent } = require('../utils/helpers');

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const {
                email, password, firstName, lastName, idNumber, phone,
                streetAddress, city, postalCode, companyName, jobTitle,
                monthlySalary, vehicleMake, vehicleModel, vehicleYear,
                licensePlate, licenseNumber
            } = req.body;

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1 OR id_number = $2',
                [email, idNumber]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'User already exists with this email or ID number'
                });
            }

            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert user
            const result = await run(`
                INSERT INTO users (
                    email, password_hash, first_name, last_name, id_number, phone,
                    street_address, city, postal_code, company_name, job_title,
                    monthly_salary, vehicle_make, vehicle_model, vehicle_year,
                    license_plate, license_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id, email, first_name, last_name, created_at
            `, [
                email, passwordHash, firstName, lastName, idNumber, phone,
                streetAddress, city, postalCode, companyName, jobTitle,
                monthlySalary, vehicleMake, vehicleModel, vehicleYear,
                licensePlate, licenseNumber
            ]);

            const user = result.rows[0];

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Log audit event
            await logAuditEvent(user.id, 'USER_REGISTERED', {}, req.ip, req.get('User-Agent'));

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        createdAt: user.created_at
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Find user
            const result = await query(
                'SELECT id, email, password_hash, first_name, last_name, is_verified, is_active FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const user = result.rows[0];

            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Log audit event
            await logAuditEvent(user.id, 'USER_LOGIN', {}, req.ip, req.get('User-Agent'));

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        isVerified: user.is_verified
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new AuthController();