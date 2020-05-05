import { Injectable } from '@nestjs/common';

interface Item {}

@Injectable()
export class ItemsService {
    private readonly items: Item[] = [];

    create(item: Item) {
        this.items.push(item);
    }

    findAll(): Item[] {
        return this.items;
    }
}
