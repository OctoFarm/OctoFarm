import {Entity, ObjectID, ObjectIdColumn} from "typeorm";

@Entity()
export class Alert {
    @ObjectIdColumn()
    id: ObjectID;
}
