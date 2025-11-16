import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterCredentialsDto } from 'src/user/dto/register-credentials.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';
import { Request } from 'express'; // <-- import Request type
import { AdminOnly } from 'src/auth/guards/admin-decorator';
import { ResponseMessage } from 'src/helpers/message.interface';

@Controller('user')
export class UserController {
  private logger = new Logger('TasksController');
  constructor(private usersService: UserService) {}

  //protect this route
  @AdminOnly()
  @Patch('/role/manager')
  async updateUser(
    @Body() updateUserRole: UpdateUserRoleDto,
    @Req() req: Request,
  ): Promise<ResponseMessage> {
    const loggedInUser = req.user;
    console.log(loggedInUser);
    const { email, managerRoleStatus } = updateUserRole;
    return this.usersService.updateUser(email, managerRoleStatus);
  }

  @Post()
  async createUser(
    @Body()
    registerCredentialsDto: RegisterCredentialsDto,
  ): Promise<ResponseMessage> {
    return this.usersService.createUser(registerCredentialsDto);
  }
}
