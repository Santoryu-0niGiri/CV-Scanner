import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

/**
 * Initializes Firebase Admin SDK with service account credentials from environment variable
 * @throws Error if FIREBASE_SERVICE_ACCOUNT_BASE64 is not set or invalid
 */
export const initializeFirebase = () => {
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!base64ServiceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
    }

    try {
        const serviceAccountString = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });

    } catch (error: any) {
        throw new Error('Firebase service account key is corrupted or malformed.');
    }
};

/**
 * Returns the Firestore database instance
 * @returns Firestore database instance
 * @throws Error if Firebase has not been initialized
 */
export const getDb = (): admin.firestore.Firestore => {
    if (!db) {
        throw new Error('Firebase has not been initialized. Call initializeFirebase first.');
    }
    return db;
};
