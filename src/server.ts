import app from './app';
import { initializeFirebase } from './config/firebase';

const PORT = process.env.PORT || 8080;

try {
    initializeFirebase();
    console.log('Firebase Admin SDK initialized successfully.');
    
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
}
