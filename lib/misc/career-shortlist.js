const ANONYMOUS_OWNER = "anonymous";

export function getShortlistOwnerId(userId) {
  return userId || ANONYMOUS_OWNER;
}

export function isCareerShortlistEntry(career) {
  return Boolean(career && typeof career === "object" && career.id && career.title);
}

export function stripPersistedPersonalization(career) {
  return {
    ...career,
    matchScore: null,
    personalizedScore: null,
    matchedSkills: [],
    missingSkills: career.skills || career.missingSkills || [],
    isPersonalized: false,
  };
}

/**
 * Load shortlist for the active owner. Legacy unscoped arrays are not trusted
 * across accounts — signed-in users get a fresh list; anonymous legacy items
 * keep career IDs but drop personalized match scores.
 */
export function readShortlistForOwner(raw, ownerId) {
  if (!raw) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
    if (parsed.ownerId !== ownerId) {
      return [];
    }
    return parsed.items.filter(isCareerShortlistEntry);
  }

  if (Array.isArray(parsed) && parsed.every(isCareerShortlistEntry)) {
    if (ownerId !== ANONYMOUS_OWNER) {
      return [];
    }
    return parsed.map(stripPersistedPersonalization);
  }

  return [];
}

/**
 * Whether the stored payload is a scoped shortlist that belongs to a different
 * owner. Such payloads must be preserved untouched when the active owner
 * changes (e.g. sign-out), otherwise the only copy of that user's shortlist
 * would be wiped.
 */
export function shortlistBelongsToAnotherOwner(raw, ownerId) {
  if (!raw) {
    return false;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }

  return Boolean(
    parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Array.isArray(parsed.items) &&
      parsed.ownerId &&
      parsed.ownerId !== ownerId
  );
}

export function writeShortlistPayload(ownerId, items) {
  return JSON.stringify({ ownerId, items });
}

export { ANONYMOUS_OWNER };
