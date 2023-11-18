/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get,  Param, Post, Put, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, CreateUserDto as LoginDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../services/session.service';
import { LogOutDto } from './dto/logout.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService
  ) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    //TODO:
    //*   - Hashing Passwords: It is important to hash passwords before storing them in the database. This can be done using a library such as bcrypt.
    //*    - Data Validation: It is recommended to validate incoming data using the class-validator package along with NestJS. This will help prevent incorrect or potentially harmful data.
    //*    - Unique email: Make sure that the email used during registration is unique in your system.

    const user = await this.usersService.create(createUserDto);
    const payload = { username: user.email, sub: user.password };
    const token = this.jwtService.sign(payload);

    // Сохраняем токен в Redis
    await this.sessionService.setSession(token, { userId: user.id });

    return { accessToken: token };
  }

  @Get(':email')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('email') email: string) {
    return this.usersService.findOne(email);
  }

  @Put(':email')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('email') email: string, @Body() updateUserDto: UpdateUserDto) {
    //TODO:
    //* - Checking if a user exists: Before updating a user, you must ensure that the user exists in the database.
    //* - Secure Password Update: If the update includes a password, make sure it is hashed before saving.
    //* - Data Validation: Use class-validator to check the correctness of the data.
    const updatedUser = await this.usersService.update(email, updateUserDto);
    const payload = { username: updatedUser.email, sub: updatedUser.id };
    const token = this.jwtService.sign(payload);

    // Renew Redis' token
    await this.sessionService.setSession(token, { userId: updatedUser.id });

    return { accessToken: token, updatedUser };
  }

  @Delete(':email')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('email') email: string) {
    return this.usersService.remove(email);
  }

  @Post('login')
  async logIn(@Body() logInDto: LoginDto) {
    const user = await this.usersService.validateUser(logInDto.email, logInDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    await this.sessionService.setSession(token, { userId: user.id });
    return { accessToken: token };
  }

  @Post('logout')
  async signOut(@Body() logOutDto: LogOutDto) {
    await this.sessionService.deleteSession(logOutDto.token);
    return { message: 'Logged out successfully' };
  }
}
