import { Request, Response, NextFunction } from 'express';
import admin = require('firebase-admin');
import AdmZip from 'adm-zip';
import { getKeywordsCollection } from '../models/keyword.model';
import { getScannedCvsCollection } from '../models/scannedCv.model';
import { extractEmailFromText, extractTextAndName } from '../utils/helper';
import { cache } from '../utils/cache';
import { ScanResponse, BatchScanResponse, BatchScanResult, BatchScanError, CVListResponse } from '../utils/interface';
import { ValidationError, NotFoundError } from '../utils/errors';

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

export const scanCv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ValidationError('No CV file uploaded. Please upload a PDF file.');
    }

    const { text: cvText, name: extractedName } = await extractTextAndName(req.file.buffer);
    const email = extractEmailFromText(cvText);
    
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
