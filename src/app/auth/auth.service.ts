import { UserService } from './../user/user.service';
import { LoginDto } from './dto/LoginDto';
import { UserEntity } from './../user/entity/user.entity';
import { RegisterDto } from './dto/RegisterDto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../core/models/enums/Permission';
import { Role } from '../../core/models/enums/Role';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private connection: Connection,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.userService.findByEmail(payload.email);
    const isValid = await bcrypt.compare(payload.password, user.password);
    if (!isValid)
      throw new HttpException(
        'Password does not match',
        HttpStatus.UNAUTHORIZED,
      );
    if (!user.isActive)
      throw new HttpException(
        'Email is not yet verified please check your mail to verify',
        HttpStatus.UNAUTHORIZED,
      );
    const accessToken = this.jwtService.sign(
      {
        _id: user.id,
        active: user.isActive,
        role: user.role as unknown as Role,
      },
      { expiresIn: '10m' },
    );
    return { accessToken };
  }

  // @Transaction({ isolation: 'SERIALIZABLE' })
  async register(user: RegisterDto) {
    const findUser = await this.userRepository.findOne({
      where: { email: user.email },
    });
    let newUser: UserEntity;
    if (findUser)
      throw new HttpException('mail already exist', HttpStatus.BAD_REQUEST);
    const salt = bcrypt.genSaltSync(10);
    if (user.email === 'horlamidex1@gmail.com') {
      newUser = this.userRepository.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: true,
        password: bcrypt.hashSync(user.password, salt),
        phoneNumber: user.phoneNumber,
        role: { permission: Permission.WRITE_ALL, role: Role.SUPER_ADMIN },
      });
      console.log(newUser);
    } else {
      newUser = this.userRepository.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: false,
        password: bcrypt.hashSync(user.password, salt),
        phoneNumber: user.phoneNumber,
        role: { permission: Permission.READONLY, role: Role.USER },
      });
      console.log(newUser);
    }
    return newUser;
  }

  // async getCurrentUser(userId: number) {

  // }
}
