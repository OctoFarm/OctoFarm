import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDefined, validate} from "class-validator";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class ClientSettings {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsDefined()
    dashboard: Object; // TODO model

    @Column()
    panelView: Object = {}; // TODO model

    @Column()
    listView: Object = {}; // TODO model

    @Column()
    cameraView: Object = {}; // TODO model;

    @Column()
    controlSettings: Object = {}; // TODO model;

    constructor(partialInput?: Partial<ClientSettings>) {
        partialInput && Object.assign(this, partialInput);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, ClientSettings.name);
    }
}