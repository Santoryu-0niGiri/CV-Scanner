import { getDb } from "../config/firebase";

/**
 * Returns Firestore scanned_cvs collection reference
 */
export const getScannedCvsCollection = () => {
  const db = getDb();
  return db.collection("scanned_cvs");
};
