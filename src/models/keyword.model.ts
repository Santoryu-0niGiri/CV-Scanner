import { getDb } from "../config/firebase";

/**
 * Returns Firestore keywords collection reference
 */
export const getKeywordsCollection = () => {
  const db = getDb();
  return db.collection("keywords");
};
