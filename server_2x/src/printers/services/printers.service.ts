import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Printer} from "../entities/printer.entity";

@Injectable()
export class PrintersService {
    constructor(
        @InjectRepository(Printer) private printerRepository: Repository<Printer>,
    ) {
    }

    async list() {
        return await this.printerRepository.find({});
    }
}
