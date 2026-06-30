import { zxcvbn } from 'zxcvbn-ts';

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
    feedback: [...result.feedback.suggestions],
    crackTime: String((result.crack_times_display as any).offline_slow_hashing_1e4_per_second ?? (result.crack_times_display as any).offline_slow_hashing_1e5_per_second ?? ''),
  };
}