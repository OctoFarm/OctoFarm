import {BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsNotEmpty, validate} from "class-validator";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectID;
    @Column()
    name: string;
    @Column({unique: true})
    username: string;
    @IsNotEmpty()
    @Column()
    passwordHash: string;
    @CreateDateColumn()
    creationTime: Date;
    @Column()
    group: string;

    constructor(partialUser?: Partial<User>) {
        partialUser && Object.assign(this, partialUser);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, User.name);
    }
}