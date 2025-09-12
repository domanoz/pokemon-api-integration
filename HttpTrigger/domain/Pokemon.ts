export class Pokemon {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly types: string[]
    ) { }

    public hasType(type: string): boolean {
        return this.types.includes(type.toLowerCase());
    }
}