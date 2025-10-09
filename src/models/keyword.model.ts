import { getDb } from "../config/firebase";

export const getKeywordsCollection = () => {
  const db = getDb();
  return db.collection("keywords");
};
