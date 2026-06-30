import { zxcvbn, zxcvbnOptions } from 'zxcvbn-ts';

// Load common password dictionaries
zxcvbnOptions.setOptions({
  // Add French/common words if needed
});

export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
  crackTime: string;
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      score: 0,
      feedback: ['Le mot de passe doit contenir au moins 8 caractères'],
      crackTime: 'instant',
    };
  }

  const result = zxcvbn(password);
  const minScore = 3; // 0-4, 3 = strong

  return {
    valid: result.score >= minScore,
    score: result.score,
    feedback: result.feedback.suggestions,
    crackTime: result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
  };
}