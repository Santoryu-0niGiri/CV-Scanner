import pdf from "pdf-parse";
import { ExtractedData } from "./interface";

export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const val = value.toLowerCase();
    if (val === "true") return true;
    if (val === "false") return false;
  }
  return Boolean(value);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

export function extractEmailFromText(rawText?: string | null): string | null {
  if (!rawText) return null;
  let t = String(rawText);

  t = t.replace(/\s*@\s*/g, "@")
       .replace(/\s*\.\s*/g, ".")
       .replace(/\b(at)\b/gi, "@")
       .replace(/\b(dot)\b/gi, ".")
       .replace(/\s{2,}/g, " ")
       .trim();

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  const matches = t.match(emailRegex);

  if (matches && matches.length > 0) return matches[0].toLowerCase();

  const alt = t.match(
    /([A-Za-z0-9._%+-]+)\s*@?\s*([A-Za-z0-9.-]+)\s*\.?\s*([A-Za-z]{2,})/i
  );
  if (alt) {
    const user = alt[1].replace(/\s+/g, "");
    const domain = alt[2].replace(/\s+/g, "");
    const tld = alt[3].toLowerCase();
    return `${user}@${domain}.${tld}`.toLowerCase();
  }

  return null;
}

function extractNameFromText(text: string): string | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const isJobTitle = (line: string): boolean => {
    const jobKeywords = /\b(developer|engineer|manager|designer|analyst|consultant|specialist|architect|administrator|coordinator|director|lead|intern|support|technician|officer|assistant|associate|executive|president|scrum|devops|qa|tester|admin)\b/i;
    return jobKeywords.test(line);
  };
  
  const isCommonHeader = (line: string): boolean => {
    return /^(education|contact|skills|experience|work|profile|reference|languages|summary|objective|certifications?|awards?|projects?|publications?|interests?|hobbies)$/i.test(line);
  };
  
  // Check for consecutive single-word lines forming a name
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    
    if (isCommonHeader(line1) || isJobTitle(line1)) continue;
    if (isCommonHeader(line2) || isJobTitle(line2)) continue;
    
    if (/^[A-Z]{2,}$/.test(line1) && /^[A-Z]{2,}$/.test(line2)) {
      return toTitleCase(`${line1} ${line2}`);
    }
  }
  
  // Check for names on single line
  for (const line of lines) {
    if (!line || isCommonHeader(line) || isJobTitle(line)) continue;

    if (/^[A-Z](\s+[A-Z\.?])+$/.test(line)) {
      const parts = line.split(/\s+/).filter(Boolean);
      const dotIdx = parts.indexOf('.');
      
      if (dotIdx > 0) {
        const firstName = parts.slice(0, dotIdx - 1).join('');
        const middleInitial = parts[dotIdx - 1] + '.';
        const lastName = parts.slice(dotIdx + 1).join('');
        return `${toTitleCase(firstName)} ${middleInitial} ${toTitleCase(lastName)}`;
      }
      return toTitleCase(parts.join(''));
    }

    const withMiddle = line.match(/^([A-Z][a-z]+)\s+([A-Z]\.)\s+([A-Z][a-z]+)$/);
    if (withMiddle) return `${withMiddle[1]} ${withMiddle[2]} ${withMiddle[3]}`;

    const capsMiddle = line.match(/^([A-Z]{2,})\s+([A-Z]\.)\s+([A-Z]{2,})$/);
    if (capsMiddle) return `${toTitleCase(capsMiddle[1])} ${capsMiddle[2]} ${toTitleCase(capsMiddle[3])}`;

    const twoNames = line.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/);
    if (twoNames) return `${twoNames[1]} ${twoNames[2]}`;

    const capsTwoNames = line.match(/^([A-Z]{2,})\s+([A-Z]{2,})$/);
    if (capsTwoNames) return toTitleCase(`${capsTwoNames[1]} ${capsTwoNames[2]}`);

    const threeNames = line.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)$/);
    if (threeNames) return `${threeNames[1]} ${threeNames[2].charAt(0)}. ${threeNames[3]}`;
  }
  
  return null;
}

export async function extractTextAndName(buffer: Buffer): Promise<ExtractedData> {
  let parsed;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      parsed = await pdf(buffer);
      break;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const fullText = parsed?.text || "";
  
  const extractedName = extractNameFromText(fullText);
  
  if (extractedName) {
    return {
      text: fullText,
      name: extractedName
    };
  }
  
  const emailMatch = extractEmailFromText(fullText);
  if (emailMatch) {
    const uname = emailMatch.split("@")[0];
    const cleanName = uname.replace(/\d+/g, "").replace(/[._-]+/g, " ").trim();
    return {
      text: fullText,
      name: toTitleCase(cleanName) || "Unknown"
    };
  }

  return { text: fullText, name: "Unknown" };
}

