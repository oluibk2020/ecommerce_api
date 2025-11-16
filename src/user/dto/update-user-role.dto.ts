import { IsBoolean, IsEmail } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEmail()
  email: string;

  @IsBoolean()
  managerRoleStatus: boolean;
}
