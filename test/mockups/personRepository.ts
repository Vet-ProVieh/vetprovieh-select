
import { Person } from "./person";
import { BaseRepository } from "@vetprovieh/vetprovieh-shared/lib";

export class PersonRepository extends BaseRepository<Person> {

    constructor(){
        super(Person.endpoint);
    }
}