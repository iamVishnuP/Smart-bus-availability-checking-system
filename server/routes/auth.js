import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register (Disabled / Blocked)
router.post('/register', (req, res) => {
    res.status(403).json({ message: 'User registration is disabled. Users access the app directly.' });
});

// Login (Strictly Admin Only)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for admin credentials strictly
        if (username === 'admin' && password === 'Damu@123') {
            // Check if admin user exists in DB, otherwise auto-create/sync it
            let adminUser = await User.findOne({ username: 'admin' });

            if (!adminUser) {
                adminUser = new User({
                    username: 'admin',
                    password: 'Damu@123',
                    role: 'admin'
                });
                await adminUser.save();
            } else {
                const isMatch = await adminUser.comparePassword('Damu@123');
                if (!isMatch) {
                    adminUser.password = 'Damu@123';
                    await adminUser.save();
                }
            }

            // Generate token for admin
            const token = jwt.sign(
                { userId: adminUser._id, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                message: 'Admin login successful',
                token,
                user: {
                    id: adminUser._id,
                    username: adminUser.username,
                    role: 'admin'
                }
            });
        }

        return res.status(401).json({ message: 'Invalid admin credentials' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
