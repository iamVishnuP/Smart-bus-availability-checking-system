/**
 * Performs a robust fuzzy comparison between two strings.
 * Sanitizes input (trims, lowercases, removes special characters) and uses Levenshtein distance.
 * Returns true if the strings match within an acceptable edit distance tolerance.
 */
export const isFuzzyMatch = (str1, str2) => {
    if (!str1 || !str2) return false;
    const s1 = str1.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (s1 === s2) return true;
    
    // Character containment matching for simple substring mistakes
    if (s1.includes(s2) && s2.length >= 4) return true;
    if (s2.includes(s1) && s1.length >= 4) return true;
    
    // Levenshtein Distance Calculation
    const track = Array(s2.length + 1).fill(null).map(() =>
        Array(s1.length + 1).fill(null));
        
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    
    const distance = track[s2.length][s1.length];
    
    // Allow 1 edit for short words (length < 6), and up to 2 edits for longer words
    const maxEdits = Math.max(1, Math.floor(Math.min(s1.length, s2.length) / 3));
    return distance <= maxEdits;
};
