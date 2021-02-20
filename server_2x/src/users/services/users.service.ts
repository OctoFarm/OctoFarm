import {Injectable} from '@nestjs/common';
import {CreateUserDto} from '../dto/create-user.dto';
import {UpdateUserDto} from '../dto/update-user.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {ObjectID, Repository} from "typeorm";
import {User} from "../entities/user.entity";
import {CryptoService} from "../../crypto/crypto.service";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        private readonly cryptoService: CryptoService
    ) {
    }

    async create(createUserDto: CreateUserDto) {
        const passwordHash = await this.cryptoService.hashPasswordAsync(createUserDto.password);
        delete createUserDto.password;
        const user = new User({
            ...createUserDto,
            passwordHash
        });
        await user.validate();
        await this.usersRepository.save(user);
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const passwordHash = await this.cryptoService.hashPasswordAsync(updateUserDto.password);
        delete updateUserDto.password;
        const user = new User({
            ...updateUserDto,
            passwordHash
        });
        await user.validate();
        await this.usersRepository.update(id, user);
    }

    async remove(id: string) {
        await this.usersRepository.delete(id);
    }

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find({});
    }

    async findOne(conditions: Partial<User>): Promise<User> {
        return await this.usersRepository.findOne(conditions);
    }

    async findById(id: string | ObjectID): Promise<User> {
        return await this.usersRepository.findOne(id);
    }

    async getUserCount() {
        return await this.usersRepository.findAndCount();
    }
}
