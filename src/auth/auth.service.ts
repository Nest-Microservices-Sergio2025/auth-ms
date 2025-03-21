import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.payload.interface';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    constructor(
        private readonly jwtService: JwtService
    ) {
        super();
    }

    private readonly logger = new Logger('AuthService');

    onModuleInit() {
        this.$connect();
        this.logger.log('MongoDb connected');
    }

    async verifyToken(token: string){
        try {
            const { sub, iat, exp, ...user} = this.jwtService.verify(token,{
                secret: envs.JWT_SECRET
            })

            return {
                user: user,
                token: await this.signJWT(user)
            }
        } catch (error) {

            console.log(error);

            throw new RpcException({
                status: 401,
                message: 'Invalid token'
            })

        }
    }


    async signJWT(payload: JwtPayload) {
        console.log(payload);

        return this.jwtService.signAsync(payload)
    }

    //save user
    async saveUser(registerUserDto: RegisterUserDto) {

        const { name, email, password } = registerUserDto;

        try {
            const user = await this.user.findUnique({
                where: { email: email }
            })

            if (user) {
                throw new RpcException({
                    status: 400,
                    message: 'User already exists'
                })
            }

            const newUser = await this.user.create({
                data: {
                    name: name,
                    email: email,
                    password: bcrypt.hashSync(password, 10)
                }
            })

            const { password: __, ...rest} = newUser


            return {
                rest,
                token: await this.signJWT(rest) // ✅ Se usa await correctamente
            }

        } catch (error) {

            throw new RpcException({
                status: 400,
                message: error.message
            })

        }
    }

    async loginUser(loginUserDto: LoginUserDto) {

        const { email, password } = loginUserDto;

        try {
            const user = await this.user.findUnique({
                where: { email: email }
            })

            if (!user) {
                throw new RpcException({
                    status: 400,
                    message: 'Not user find'
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password)

            if (!isPasswordValid) {
                throw new RpcException({
                    status: 400,
                    message: 'Invalid user'
                })
            }

            const { password: __, ...rest } = user


            return {
                user: rest,
                token: await this.signJWT(rest)
            }

        } catch (error) {

            throw new RpcException({
                status: 400,
                message: error.message
            })

        }
    }
}
