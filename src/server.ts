import app from './app';
import { initializeFirebase } from './config/firebase';

const PORT = process.env.PORT || 8080;

try {
    initializeFirebase();
    app.listen(PORT);
} catch (error) {
    process.exit(1);
}
