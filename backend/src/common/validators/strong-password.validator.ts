import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { zxcvbn } from 'zxcvbn-ts';

@ValidatorConstraint({ async: false })
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  private readonly MIN_SCORE = 3; // 0-4, 3 = strong

  validate(password: string, args: ValidationArguments) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    const result = zxcvbn(password);
    return result.score >= this.MIN_SCORE;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Mot de passe trop faible. Utilisez au moins 12 caractères avec majuscules, minuscules, chiffres et symboles. Évitez les mots courants et les séquences prévisibles.';
  }
}