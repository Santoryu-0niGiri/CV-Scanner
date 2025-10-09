import { Request, Response, NextFunction } from 'express';
import admin = require('firebase-admin');
import { getKeywordsCollection } from '../models/keyword.model';
import { toBoolean } from '../utils/helper';
import { cache } from '../utils/cache';
import { Keyword, KeywordListResponse } from '../utils/interface';
import { ValidationError, NotFoundError } from '../utils/errors';
import { PAGINATION } from '../utils/constants';

export const createKeyword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new ValidationError('Keyword name is required and must be a non-empty string.');
        }

        const keywordsCollection = getKeywordsCollection();
        const newKeyword = {
            name,
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };
        const docRef = await keywordsCollection.add(newKeyword);
        const savedKeyword = (await docRef.get()).data();
        
        const response: Keyword = {
            id: docRef.id,
            name: savedKeyword?.name,
            isActive: savedKeyword?.isActive,
            createdAt: savedKeyword?.createdAt.toDate().toISOString(),
            updatedAt: savedKeyword?.updatedAt.toDate().toISOString()
        };
        
        cache.clear('active_keywords');
        return res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

export const getKeywords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { isActive, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = String(PAGINATION.DEFAULT_LIMIT) } = req.query;

        const allowedSort = ["name", "createdAt"];
        const sortField = allowedSort.includes(String(sortBy)) ? String(sortBy) : "createdAt";
        const order: "asc" | "desc" = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

        const pageNumber = Math.max(PAGINATION.DEFAULT_PAGE, Number(page) || PAGINATION.DEFAULT_PAGE);
        const lim = Math.min(Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT), PAGINATION.MAX_LIMIT);
        const offset = (pageNumber - 1) * lim;

        const collection = getKeywordsCollection();
        let query: FirebaseFirestore.Query = collection;

        if (isActive !== undefined) {
            const isActiveBool = isActive === "true";
            query = query.where("isActive", "==", isActiveBool);
        }

        query = query.orderBy(sortField, order);
        query = query.offset(offset).limit(lim);

        const snap = await query.get();
        const items: Keyword[] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
            isActive: d.data().isActive,
            createdAt: d.data().createdAt.toDate().toISOString(),
            updatedAt: d.data().updatedAt.toDate().toISOString()
        }));

        const response: KeywordListResponse = { page: pageNumber, limit: lim, items };
        return res.json(response);
    } catch (error) {
        next(error);
    }
};

export const getKeywordById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) throw new ValidationError('Keyword ID is required.');

        const collection = getKeywordsCollection();
        const doc = await collection.doc(id).get();
        if (!doc.exists) throw new NotFoundError(`Keyword with ID '${id}' not found.`);
        
        const response: Keyword = {
            id: doc.id,
            name: doc.data()?.name,
            isActive: doc.data()?.isActive,
            createdAt: doc.data()?.createdAt.toDate().toISOString(),
            updatedAt: doc.data()?.updatedAt.toDate().toISOString()
        };
        
        return res.json(response);
    } catch (error) {
        next(error);
    }
};

export const updateKeyword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id) throw new ValidationError('Keyword ID is required.');
        if (!name || typeof name !== "string" || !name.trim()) {
            throw new ValidationError('Keyword name is required and must be a non-empty string.');
        }

        const collection = getKeywordsCollection();
        const docRef = collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundError(`Keyword with ID '${id}' not found.`);

        await docRef.update({ name: name.trim(), updatedAt: admin.firestore.Timestamp.now() });
        const updated = await docRef.get();

        const response: Keyword = {
            id: updated.id,
            name: updated.data()?.name,
            isActive: updated.data()?.isActive,
            createdAt: updated.data()?.createdAt.toDate().toISOString(),
            updatedAt: updated.data()?.updatedAt.toDate().toISOString()
        };

        cache.clear('active_keywords');
        return res.json(response);
    } catch (error) {
        next(error);
    }
};

export const updateKeywordStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!id) throw new ValidationError('Keyword ID is required.');
        if (isActive === undefined) throw new ValidationError('isActive field is required.');

        const collection = getKeywordsCollection();
        const docRef = collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundError(`Keyword with ID '${id}' not found.`);

        await docRef.update({ isActive: toBoolean(isActive), updatedAt: admin.firestore.Timestamp.now() });
        const updated = await docRef.get();
        
        const response: Keyword = {
            id: updated.id,
            name: updated.data()?.name,
            isActive: updated.data()?.isActive,
            createdAt: updated.data()?.createdAt.toDate().toISOString(),
            updatedAt: updated.data()?.updatedAt.toDate().toISOString()
        };
        
        cache.clear('active_keywords');
        return res.json(response);
    } catch (error) {
        next(error);
    }
};

export const deleteKeyword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) throw new ValidationError('Keyword ID is required.');

        const collection = getKeywordsCollection();
        const docRef = collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new NotFoundError(`Keyword with ID '${id}' not found.`);

        await docRef.delete();
        
        cache.clear('active_keywords');
        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
};