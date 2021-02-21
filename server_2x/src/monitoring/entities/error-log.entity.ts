import {Entity, ObjectID, ObjectIdColumn} from "typeorm";

@Entity()
export class ErrorLog {
    @ObjectIdColumn()
    id: ObjectID;
}
