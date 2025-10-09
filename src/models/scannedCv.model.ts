import { getDb } from "../config/firebase";

export const getScannedCvsCollection = () => {
  const db = getDb();
  return db.collection("scanned_cvs");
};
