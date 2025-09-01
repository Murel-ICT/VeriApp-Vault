const { query, run } = require('../config/database');
const { generateOTPCode, logAuditEvent } = require('../utils/helpers');

class UserController {
    // Get user profile
    async getProfile(req, res) {
        try {
            const result = await query(`
                SELECT 
                    id, email, first_name, last_name, id_number, phone,
                    street_address, city, postal_code, company_name, job_title,
                    monthly_salary, vehicle_make, vehicle_model, vehicle_year,
                    license_plate, license_number, is_verified, created_at
                FROM users 
                WHERE id = $1
            `, [req.user.id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result.rows[0];

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        idNumber: user.id_number,
                        phone: user.phone,
                        address: {
                            street: user.street_address,
                            city: user.city,
                            postalCode: user.postal_code
                        },
                        employment: {
                            company: user.company_name,
                            jobTitle: user.job_title,
                            monthlySalary: user.monthly_salary
                        },
                        vehicle: {
                            make: user.vehicle_make,
                            model: user.vehicle_model,
                            year: user.vehicle_year,
                            licensePlate: user.license_plate,
                            licenseNumber: user.license_number
                        },
                        isVerified: user.is_verified,
                        createdAt: user.created_at
                    }
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Generate OTP for data access
    async generateOTP(req, res) {
        try {
            // Generate unique OTP code
            const otpCode = generateOTPCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Save OTP to database
            await pool.query(`
                INSERT INTO otps (user_id, code, type, expires_at)
                VALUES ($1, $2, 'access', $3)
            `, [req.user.id, otpCode, expiresAt]);

            // Log audit event
            await logAuditEvent(req.user.id, 'OTP_GENERATED', { type: 'access' }, req.ip, req.get('User-Agent'));

            res.json({
                success: true,
                message: 'OTP generated successfully',
                data: {
                    code: otpCode,
                    expiresAt: expiresAt,
                    validFor: 600 // seconds
                }
            });

        } catch (error) {
            console.error('Generate OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new UserController();