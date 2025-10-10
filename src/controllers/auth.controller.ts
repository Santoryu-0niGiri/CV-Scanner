/**
 * Authentication Controller
 * Handles user registration, login, and JWT token generation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { isValidEmail } from '../utils/helper';

const getUsersCollection = () => admin.firestore().collection('users');

/**
 * Registers a new user with email and password
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password) {
            throw new ValidationError('Email and password are required.');
        }

        if (!isValidEmail(email)) {
            throw new ValidationError('Invalid email format.');
        }

        if (password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters.');
        }

        const usersCollection = getUsersCollection();
        const existingUser = await usersCollection.doc(email.toLowerCase()).get();
        
        if (existingUser.exists) {
            throw new ValidationError('User already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await usersCollection.doc(email.toLowerCase()).set({
            email: email.toLowerCase(),
            name: name || '',
            password: hashedPassword,
            createdAt: admin.firestore.Timestamp.now()
        });

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured.');
        }

        const token = jwt.sign(
            { userId: email.toLowerCase(), email: email.toLowerCase() },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, email: email.toLowerCase(), name: name || '' });
    } catch (error) {
        next(error);
    }
};

/**
 * Authenticates user and returns JWT token
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            throw new ValidationError('Email and password are required.');
        }

        if (!isValidEmail(email)) {
            throw new ValidationError('Invalid email format.');
        }

        const usersCollection = getUsersCollection();
        const userDoc = await usersCollection.doc(email.toLowerCase()).get();
        
        if (!userDoc.exists) {
            throw new UnauthorizedError('Invalid credentials.');
        }

        const userData = userDoc.data();
        const isValidPassword = await bcrypt.compare(password, userData?.password);
        
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials.');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured.');
        }

        const token = jwt.sign(
            { userId: email.toLowerCase(), email: email.toLowerCase() },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, email: userData?.email, name: userData?.name });
    } catch (error) {
        next(error);
    }
};
