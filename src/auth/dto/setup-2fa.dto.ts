import { IsString, Length, IsOptional } from 'class-validator';

export class Setup2faDto {
  @IsString()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}

export class Verify2faDto {
  @IsString()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class Disable2faDto {
  @IsString()
  @Length(6, 6, { message: 'Token must be 6 digits' })
  token: string;
}
