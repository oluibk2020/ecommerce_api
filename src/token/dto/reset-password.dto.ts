import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsNumber()
  token: number;

  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,20})/, {
    message:
      'password too weak. Must have a special character, upper and lower case letters and a number',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class EmailDto {
  @IsNotEmpty()
  @IsEmail()
  @IsEmail()
  email: string;
}
