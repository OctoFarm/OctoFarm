import {Entity, ObjectID, ObjectIdColumn} from "typeorm";

@Entity()
export class FarmStatistics {
    @ObjectIdColumn()
    id: ObjectID;
}
