/**
 * CV Scanning Controller
 * Handles CV upload, scanning, keyword matching, and batch processing
 */

import { Request, Response, NextFunction } from 'express';
import admin = require('firebase-admin');
import AdmZip from 'adm-zip';
import { getKeywordsCollection } from '../models/keyword.model';
import { getScannedCvsCollection } from '../models/scannedCv.model';
import { extractEmailFromText, extractTextAndName } from '../utils/helper';
import { cache } from '../utils/cache';
import { ScanResponse, BatchScanResponse, BatchScanResult, BatchScanError, CVListResponse } from '../utils/interface';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Retrieves active keywords from cache or Firestore database
 * @returns Promise<string[]> Array of active keyword names
 */
async function getActiveKeywords(): Promise<string[]> {
    const cached = cache.get('active_keywords');
    
    if (cached && Array.isArray(cached)) {
        return cached as string[];
    }
    
    const keywordsSnap = await getKeywordsCollection().where('isActive', '==', true).get();
    const activeKeywords = keywordsSnap.docs.map(doc => doc.data().name);
    cache.set('active_keywords', activeKeywords);
    
    return activeKeywords;
}

/**
 * Validates if uploaded document is a CV by checking for common CV keywords
 * @param text - Extracted text from PDF document
 * @returns boolean - True if document contains at least 2 CV-related keywords
 */
function isCVDocument(text: string): boolean {
  const lowerText = text.toLowerCase();
  const cvKeywords = ['profile', 'about me', 'contact', 'skills', 'experience', 'work experience', 'education', 'qualification', 'resume', 'curriculum vitae'];
  const matchCount = cvKeywords.filter(keyword => lowerText.includes(keyword)).length;
  return matchCount >= 2;
}


/**
 * Scans a single PDF CV file and matches it against active keywords
 * @route POST /api/v1/scan
 * @param req.file - Uploaded PDF file (multipart/form-data)
 * @returns ScanResponse with email, name, matched keywords, and timestamps
 * @throws ValidationError if no file uploaded, invalid CV, or no email found
 */
export const scanCv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ValidationError('No CV file uploaded. Please upload a PDF file.');
    }

      const { text: cvText, name: extractedName } = await extractTextAndName(req.file.buffer);
      const email = extractEmailFromText(cvText);
      
        if (!isCVDocument(cvText)) {
        throw new ValidationError('The uploaded file does not appear to be a CV/resume. Please upload a valid CV document.');
      }
    
    if (!email) {
      throw new ValidationError('No email address found in CV. Please ensure the CV contains a valid email.');
    }

    const activeKeywords = await getActiveKeywords();

    const lowerText = cvText.toLowerCase();
    const matches = activeKeywords.filter(k => lowerText.includes(k.toLowerCase()));
    const matchedKeywords = Array.from(new Set(matches));

    const now = admin.firestore.Timestamp.now();
    await getScannedCvsCollection().doc(email.toLowerCase()).set({
      email,
      extractedName,
      matchedKeywords,
      fullText: cvText,
      scannedAt: now,
      updatedAt: now,
    });

    const response: ScanResponse = {
      email,
      extractedName,
      matchedKeywords,
      scannedAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Re-evaluates a previously scanned CV against current active keywords
 * @route POST /api/v1/rescan
 * @param req.body.email - Email address of the CV to rescan
 * @returns ScanResponse with updated matched keywords
 * @throws ValidationError if email is invalid
 * @throws NotFoundError if CV not found in database
 */
export const rescanCv = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !email.trim()) {
            throw new ValidationError('Valid email address is required for rescan.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format.');
        }

        const docRef = getScannedCvsCollection().doc(email.toLowerCase());
        const docSnap = await docRef.get();
        if (!docSnap.exists) throw new NotFoundError(`CV with email '${email}' not found.`);

        const cvData = docSnap.data();
        const activeKeywords = await getActiveKeywords();

        const matchedKeywords = Array.from(new Set(
            activeKeywords.filter(k => cvData?.fullText.toLowerCase().includes(k.toLowerCase()))
        ));

        const now = admin.firestore.Timestamp.now();
        await docRef.update({ matchedKeywords, updatedAt: now });

        const response: ScanResponse = {
            email,
            extractedName: cvData?.extractedName,
            matchedKeywords,
            scannedAt: cvData?.scannedAt.toDate().toISOString(),
            updatedAt: now.toDate().toISOString(),
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves all scanned CVs from Firestore database
 * @route GET /api/v1/scanned-cvs
 * @returns CVListResponse containing array of all scanned CVs
 */
export const getAllScannedCvs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const snapshot = await getScannedCvsCollection().get();
        const cvs = snapshot.docs.map(doc => ({
            email: doc.id,
            extractedName: doc.data()?.extractedName,
            matchedKeywords: doc.data()?.matchedKeywords || [],
            fullText: doc.data()?.fullText || '',
            scannedAt: doc.data()?.scannedAt?.toDate().toISOString(),
            updatedAt: doc.data()?.updatedAt?.toDate().toISOString()
        }));

        const response: CVListResponse = { items: cvs };
        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes a scanned CV from the database
 * @route DELETE /api/v1/scanned-cvs/:email
 * @param req.params.email - Email address of CV to delete
 * @returns Success response
 * @throws ValidationError if email not provided
 * @throws NotFoundError if CV not found
 */
export const deleteScannedCv = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        if (!email) throw new ValidationError('Email parameter is required.');

        const docRef = getScannedCvsCollection().doc(email.toLowerCase());
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundError(`CV with email '${email}' not found.`);

        await docRef.delete();
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * Processes multiple PDF CVs from a ZIP archive in batch
 * @route POST /api/v1/batch/scan
 * @param req.file - Uploaded ZIP file containing PDF CVs
 * @returns BatchScanResponse with processed/failed counts and detailed results
 * @throws ValidationError if no ZIP uploaded or no PDFs found in ZIP
 */
export const batchScanCvs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            throw new ValidationError('No ZIP file uploaded. Please upload a ZIP file containing PDFs.');
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();
        const pdfEntries = zipEntries.filter(entry => 
            !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.pdf')
        );

        if (pdfEntries.length === 0) {
            throw new ValidationError('No PDF files found in ZIP. Please ensure the ZIP contains PDF files.');
        }

        const activeKeywords = await getActiveKeywords();

        const results: BatchScanResult[] = [];
        const errors: BatchScanError[] = [];

        for (const entry of pdfEntries) {
            try {
                const buffer = entry.getData();
                const { text: cvText, name: extractedName } = await extractTextAndName(buffer);
                const email = extractEmailFromText(cvText);

                if (!email) {
                    errors.push({ file: entry.entryName, error: 'No email found' });
                    continue;
                }

                const lowerText = cvText.toLowerCase();
                const matches = activeKeywords.filter(k => lowerText.includes(k.toLowerCase()));
                const matchedKeywords = Array.from(new Set(matches));

                const now = admin.firestore.Timestamp.now();
                await getScannedCvsCollection().doc(email.toLowerCase()).set({
                    email,
                    extractedName,
                    matchedKeywords,
                    fullText: cvText,
                    scannedAt: now,
                    updatedAt: now,
                });

                results.push({
                    file: entry.entryName,
                    email,
                    extractedName,
                    matchedKeywords,
                    scannedAt: now.toDate().toISOString()
                });
            } catch (error: any) {
                errors.push({ file: entry.entryName, error: error.message });
            }
        }

        const response: BatchScanResponse = {
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};
