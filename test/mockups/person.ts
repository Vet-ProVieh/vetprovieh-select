import { BaseModel } from "@vetprovieh/vetprovieh-shared/lib/orm/baseModel";

export class Person extends BaseModel {
    id: number | undefined;
    name: string | undefined;
}