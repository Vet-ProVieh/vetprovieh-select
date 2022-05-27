
import { Person } from "./person";
import { BaseRepository } from "@vetprovieh/vetprovieh-shared";

export class PersonRepository extends BaseRepository<Person> {

    constructor(){
        super(Person.endpoint);
    }
}