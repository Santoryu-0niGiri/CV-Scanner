# CV Scanner API - Code Documentation

## Project Structure

```
src/
├── config/          # Firebase configuration
├── controllers/     # Request handlers and business logic
├── middlewares/     # Express middleware (auth, error handling, file upload)
├── models/          # Database collection accessors
├── routes/          # API route definitions
├── utils/           # Helper functions, interfaces, constants
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## Core Files Documentation

### Controllers

#### `auth.controller.ts`
Handles user authentication and JWT token management.
- **register**: Creates new user with hashed password, returns JWT token
- **login**: Validates credentials, returns JWT token (expires in 24h)

#### `keyword.controller.ts`
Manages CRUD operations for skill keywords.
- **createKeyword**: Adds new keyword with isActive=true by default
- **getKeywords**: Paginated list with filtering (isActive), sorting (name/createdAt), max 100 per page
- **getKeywordById**: Retrieves single keyword
- **updateKeyword**: Updates keyword name, clears cache
- **updateKeywordStatus**: Activates/deactivates keyword, clears cache
- **deleteKeyword**: Removes keyword, clears cache

#### `scan.controller.ts`
Handles CV scanning and keyword matching.
- **scanCv**: Extracts text from PDF, finds email/name, matches active keywords
- **rescanCv**: Re-evaluates existing CV against current active keywords
- **getAllScannedCvs**: Returns all scanned CVs from database
- **deleteScannedCv**: Removes scanned CV by email
- **batchScanCvs**: Processes multiple PDFs from ZIP file
- **getActiveKeywords**: Helper function with caching (5min TTL)
- **isCVDocument**: Validates if document is a CV (checks for 2+ CV keywords)

### Middlewares

#### `auth.middleware.ts`
JWT authentication middleware.
- Extracts token from Authorization header
- Verifies token using JWT_SECRET
- Attaches user info to request object

#### `error.middleware.ts`
Centralized error handling.
- Handles Multer file upload errors
- Handles Firebase/Firestore errors
- Returns consistent error responses
- Includes stack trace in development mode

#### `upload.middleware.ts`
File upload configuration using Multer.
- Memory storage (no disk writes)
- 5MB file size limit
- Accepts PDF and ZIP files only

### Models

#### `keyword.model.ts`
Returns Firestore "keywords" collection reference.

#### `scannedCv.model.ts`
Returns Firestore "scanned_cvs" collection reference.

### Utils

#### `helper.ts`
Utility functions for data processing.
- **toBoolean**: Converts string/boolean to boolean
- **isValidEmail**: Validates email format with regex
- **extractEmailFromText**: Extracts email from CV text (handles "at", "dot" variations)
- **extractTextAndName**: Extracts text and name from PDF buffer with retry logic
- **extractNameFromText**: Complex name extraction with multiple patterns

#### `cache.ts`
Simple in-memory cache implementation.
- 5-minute TTL for cached data
- Used for active keywords to reduce Firestore reads

#### `constants.ts`
Application constants.
- FILE_LIMITS: Max file size (5MB)
- CACHE_CONFIG: Cache TTL (5 minutes)
- PAGINATION: Default page (1), limit (10), max limit (100)
- JWT_CONFIG: Token expiration (24h)

#### `errors.ts`
Custom error classes.
- **AppError**: Base error class
- **ValidationError**: 400 errors
- **NotFoundError**: 404 errors
- **UnauthorizedError**: 401 errors
- **DatabaseError**: 503 errors

#### `interface.ts`
TypeScript interfaces for type safety.
- Keyword, ScannedCV, ScanResponse, BatchScanResponse, etc.

### Configuration

#### `firebase.ts`
Firebase Admin SDK initialization.
- Decodes base64 service account from env variable
- Initializes Firestore with ignoreUndefinedProperties
- Exports getDb() function for database access

## API Flow

### Authentication Flow
1. User registers/logs in → POST /api/v1/auth/register or /login
2. Server validates input, hashes password (bcrypt)
3. Server generates JWT token (24h expiration)
4. Client stores token, includes in Authorization header for protected routes

### CV Scanning Flow
1. Client uploads PDF → POST /api/v1/scan
2. Middleware validates file (PDF, <5MB)
3. Controller extracts text using pdf-parse
4. Controller validates document is a CV (isCVDocument)
5. Controller extracts email (required) and name
6. Controller fetches active keywords (cached)
7. Controller performs case-insensitive keyword matching
8. Controller stores results in Firestore (email as document ID)
9. Returns matched keywords and metadata

### Keyword Management Flow
1. All keyword endpoints require JWT authentication
2. Cache is cleared on create/update/delete operations
3. Active keywords are cached for 5 minutes
4. Pagination prevents excessive data transfer

## Environment Variables

```
PORT=8080
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>
JWT_SECRET=<your-secret-key>
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Email validation
- Input sanitization
- File type validation
- File size limits
- Error message sanitization (no stack traces in production)

## Performance Optimizations

- In-memory caching for active keywords
- Firestore query optimization with indexing
- Pagination to limit data transfer
- PDF parsing with retry logic (5 attempts)
