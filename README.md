# **Take-Home Examination: CV Scanner API**

Welcome to the take-home examination for the TypeScript Developer position. The goal of this exercise is to assess your ability to design, build, debug, and document a RESTful API using modern TypeScript practices.

## **Project Overview**

You are tasked with building a "CV Scanner" API. This service will allow users to manage a list of skills (keywords) and scan CV documents (in PDF format) to see which of those skills are present. The results of the scan should be stored and retrievable.

## **Core Technologies**

* **Language:** TypeScript  
* **Framework:** Node.js / Express.js  
* **Database:** Google Firestore  
* **API Testing:** Postman (or any similar tool)

## **Part 1: Setup, Debugging & Instructions**

Your first task is to get the project running, document your work, and demonstrate your problem-solving skills.

**Important Note:** The initial state of this repository is **intentionally left with missing pieces and potential errors**. Part of your task is to identify and resolve these issues to get the server running correctly. You have the complete freedom to restructure the codebase, add new files, or refactor existing code as you see fit. We encourage you to apply your preferred coding standards and architectural patterns.

**Your Task:**

1. **Clone the Repository:** Start by cloning the project from the following URL:  
   git clone \[https://github.com/parallelqt25/cv-scanner-api-exam.git\](https://github.com/parallelqt25/cv-scanner-api-exam.git)

2. **Create Your Own Public GitHub Repository:** Push this initial code to a new public repository under your own GitHub account. You will submit the link to your repository for review.  
3. **Firebase Setup:**  
   * Create a new Firebase project.  
   * In your project, enable the **Firestore Database**.  
   * Go to Project Settings \-\> Service Accounts.  
   * Click "Generate new private key" and download the JSON file. **Do not commit this file to GitHub.**  
4. **Project Configuration:**  
   * Create a .env file in the root of the project (use .env.example as a template).  
   * Base64-encode the contents of your downloaded Firebase service account JSON. You can use an online tool or a command-line utility.  
   * Set FIREBASE\_SERVICE\_ACCOUNT\_BASE64 in your .env file with the Base64 string.  
   * Set PORT to 8080 or another port of your choice.  
5. **Install, Debug & Run:**  
   * Run npm install.  
   * Attempt to run npm run dev.  
   * **Debug any errors** that prevent the application from starting successfully.  
6. **Complete this README:**  
   * Fill out the **API Documentation** section below with detailed information for every endpoint you build. Explain the request body, query parameters, and show example success/error responses. This is a critical part of the evaluation.  
   * Ensure your setup instructions are clear and repeatable.

## **Part 2: Feature Implementation**

This is the core of the exam. Implement the following features based on the specification.

### **1\. CRUD API for Keywords**

Create a set of endpoints to manage keywords. A keyword represents a skill we want to scan for in a CV.

* **Data Model for a Keyword:**  
  * id (string, Firestore auto-generated)  
  * name (string, e.g., "JavaScript", "Project Management")  
  * isActive (boolean, defaults to true)  
  * createdAt (Timestamp)  
  * updatedAt (Timestamp)  
* **Endpoints:**  
  * POST /keywords: Create a new keyword.  
  * GET /keywords: Retrieve a list of keywords.  
  * GET /keywords/:id: Get a single keyword by its ID.  
  * PUT /keywords/:id: Update a keyword's name.  
  * PATCH /keywords/:id/status: A dedicated endpoint to update the isActive status (activate/deactivate).  
  * DELETE /keywords/:id: Delete a keyword.

### **2\. Advanced Keyword Searching**

Enhance the GET /keywords endpoint to support the following features using query parameters:

* **Filtering:** Filter by isActive status (e.g., /keywords?isActive=true).  
* **Sorting:** Sort by name or createdAt (e.g., /keywords?sortBy=name\&sortOrder=asc).  
* **Pagination:** Support page-based pagination (e.g., /keywords?page=1\&limit=10).

### **3\. CV Scanning Endpoint**

This is the primary feature of the API.

* **Endpoint:** POST /scan  
* **Request:** multipart/form-data containing a single PDF file (.pdf).  
* **Logic:**  
  1. Accept the PDF file.  
  2. Extract all text from the PDF.  
  3. Find an email address in the text. This email will serve as the unique identifier (primary key) for the CV data. If no email is found, return an error.  
  4. (Simplified) Attempt to find the person's name. You can use a simple heuristic, like assuming the first one or two non-email words on the first line are the name.  
  5. Fetch all **active** keywords from Firestore.  
  6. Perform a case-insensitive search for each active keyword within the extracted CV text.  
  7. Store the results in a new Firestore collection called scanned\_cvs. Use the found email as the document ID.  
  * **Data Model for a Scanned CV:**  
    * email (string, the document ID)  
    * extractedName (string)  
    * matchedKeywords (array of strings)  
    * fullText (string, the complete text from the CV for rescanning purposes)  
    * scannedAt (Timestamp)  
    * updatedAt (Timestamp)  
  8. If a CV with the same email already exists, it should be **overwritten** with the new scan results.  
* **Response:** Return the saved Scanned CV object.

### **4\. Rescan Endpoint**

Create an endpoint to re-evaluate a previously scanned CV against the current set of active keywords without requiring a file re-upload.

* **Endpoint:** POST /rescan  
* **Request Body:** { "email": "applicant@example.com" }  
* **Logic:**  
  1. Find the scanned\_cvs document corresponding to the given email.  
  2. Fetch the latest list of **active** keywords from Firestore.  
  3. Re-run the matching logic using the stored fullText from the CV document.  
  4. Update the matchedKeywords and updatedAt fields in the existing Firestore document.  
* **Response:** Return the updated Scanned CV object.

## **Part 3: Plus Points (Optional)**

If you have time and wish to demonstrate additional skills, consider implementing one or more of the following features.

* **/batch/scan Endpoint:** Accept a .zip file containing multiple PDFs and process them all in a single request.  
* **Basic UI:** A simple HTML/JavaScript frontend that allows users to upload a CV and see the scan results.  
* **Authentication:** Protect the API endpoints using JWT (JSON Web Tokens).  
* **Caching:** Implement a caching layer (e.g., in-memory or Redis) for the active keywords to reduce Firestore reads.

## **Submission**

To submit your work, please provide the public URL to your completed GitHub repository. Make sure your final commit history is clean and professional.

Good luck\!

## **API Documentation**

### **Keywords API**

| Method | Endpoint | Description | Request Body / Params | Success Response (200) | Error Response (4xx/5xx) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| POST | /api/v1/keywords | Create a new keyword | `{"name": "JavaScript"}` | `{"id": "abc123", "name": "JavaScript", "isActive": true, "createdAt": "2024-01-15T10:30:00.000Z", "updatedAt": "2024-01-15T10:30:00.000Z"}` | `400: {"error": "Keyword name is required and must be a non-empty string."}` |
| GET | /api/v1/keywords | Retrieve paginated list of keywords with filtering and sorting | Query params: `isActive` (true/false), `sortBy` (name/createdAt), `sortOrder` (asc/desc), `page` (default: 1), `limit` (default: 10) | `{"page": 1, "limit": 10, "items": [{"id": "abc123", "name": "JavaScript", "isActive": true, "createdAt": "...", "updatedAt": "..."}]}` | N/A |
| GET | /api/v1/keywords/:id | Get a single keyword by ID | URL param: `id` | `{"id": "abc123", "name": "JavaScript", "isActive": true, "createdAt": "...", "updatedAt": "..."}` | `404: {"error": "Keyword with ID 'abc123' not found."}` |
| PUT | /api/v1/keywords/:id | Update a keyword's name | URL param: `id`, Body: `{"name": "TypeScript"}` | `{"id": "abc123", "name": "TypeScript", "isActive": true, "createdAt": "...", "updatedAt": "..."}` | `400: {"error": "Keyword name is required..."}`<br>`404: {"error": "Keyword with ID 'abc123' not found."}` |
| PATCH | /api/v1/keywords/:id/status | Update a keyword's active status | URL param: `id`, Body: `{"isActive": false}` | `{"id": "abc123", "name": "JavaScript", "isActive": false, "createdAt": "...", "updatedAt": "..."}` | `400: {"error": "isActive field is required."}`<br>`404: {"error": "Keyword with ID 'abc123' not found."}` |
| DELETE | /api/v1/keywords/:id | Delete a keyword | URL param: `id` | `{"success": true}` | `404: {"error": "Keyword with ID 'abc123' not found."}` |

### **Scan API**

| Method | Endpoint | Description | Request Body / Params | Success Response (200) | Error Response (4xx/5xx) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| POST | /api/v1/scan | Scan a CV PDF file and extract matched keywords | `multipart/form-data` with field `file` (PDF) | `{"email": "john.doe@example.com", "extractedName": "John Doe", "matchedKeywords": ["JavaScript", "TypeScript"], "scannedAt": "...", "updatedAt": "..."}` | `400: {"error": "No CV file uploaded..."}`<br>`400: {"error": "No email address found in CV..."}` |
| POST | /api/v1/rescan | Rescan a previously uploaded CV against current active keywords | `{"email": "john.doe@example.com"}` | `{"email": "john.doe@example.com", "extractedName": "John Doe", "matchedKeywords": ["JavaScript", "Python"], "scannedAt": "...", "updatedAt": "..."}` | `400: {"error": "Valid email address is required..."}`<br>`404: {"error": "CV with email '...' not found."}` |

### **Bonus Features**

| Method | Endpoint | Description | Request Body / Params | Success Response (200) | Error Response (4xx/5xx) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| POST | /api/v1/batch/scan | Batch scan multiple CV PDF files from a ZIP archive | `multipart/form-data` with field `file` (ZIP containing PDFs) | `{"success": true, "processed": 3, "failed": 1, "results": [{"file": "john_doe.pdf", "email": "...", "extractedName": "...", "matchedKeywords": [...], "scannedAt": "..."}], "errors": [{"file": "invalid.pdf", "error": "No email found"}]}` | `400: {"error": "No ZIP file uploaded..."}` |

### **Authentication API**

| Method | Endpoint | Description | Request Body / Params | Success Response (200) | Error Response (4xx/5xx) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| POST | /api/v1/auth/register | Register a new user account | `{"email": "user@example.com", "password": "password123", "name": "John Doe"}` | `{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "email": "user@example.com", "name": "John Doe"}` | `400: {"error": "Email and password are required."}`<br>`400: {"error": "User already exists."}` |
| POST | /api/v1/auth/login | Login and receive JWT token | `{"email": "user@example.com", "password": "password123"}` | `{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "email": "user@example.com", "name": "John Doe"}` | `400: {"error": "Email and password are required."}`<br>`401: {"error": "Invalid credentials."}` |

**Note:** All Keywords and Scan API endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

