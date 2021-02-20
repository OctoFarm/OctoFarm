import {validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class Printer {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

    @CreateDateColumn()
    creationTime: Date;

    @Column()
    apiKey: string;

    constructor(partialPrinter?: Partial<Printer>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, 'Printer');
    }
}