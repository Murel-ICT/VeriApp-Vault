const { query, run } = require('../config/database');

// Generate OTP code
function generateOTPCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const part1 = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const part2 = Array.from({length: 3}, () => numbers[Math.floor(Math.random() * numbers.length)]).join('');
    const part3 = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    
    return `${part1}-${part2}-${part3}`;
}

// Log audit event
async function logAuditEvent(userId, action, details = {}, ipAddress = null, userAgent = null) {
    try {
        await run(`
            INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, action, JSON.stringify(details), ipAddress, userAgent]);
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

module.exports = {
    generateOTPCode,
    logAuditEvent
};