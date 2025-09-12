import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { Transform, TransformFnParams } from "class-transformer";
import _ from "lodash";
import { InvalidParameterError } from "../errors/InvalidParameterError";

export class PokemonRequestDto {
    private static readonly MAX_IDS_PER_REQUEST: number = 10;

    @IsNotEmpty({ message: 'The "id" parameter is required' })
    @Transform(({ value }: TransformFnParams): number[] => {
        const inputStr: string = String(value || '').trim();

        const ids: string[] = inputStr
            .split(',')
            .map((id: string): string => id.trim())
            .filter((id: string): boolean => id.length > 0);

        if (ids.length === 0) {
            throw new InvalidParameterError('No valid Pokemon IDs provided');
        }

        if (ids.length > PokemonRequestDto.MAX_IDS_PER_REQUEST) {
            throw new InvalidParameterError(
                `Maximum ${PokemonRequestDto.MAX_IDS_PER_REQUEST} Pokemon IDs are allowed`
            );
        }

        const parsedIds: number[] = ids.map((id: string, index: number): number => {
            const numId: number = Number(id);

            if (!Number.isInteger(numId)) {
                throw new InvalidParameterError(
                    `Invalid Pokemon ID at position ${index + 1}: "${id}". Must be a whole number.`
                );
            }

            if (numId <= 0) {
                throw new InvalidParameterError(
                    `Invalid Pokemon ID at position ${index + 1}: ${numId}. Must be greater than 0.`
                );
            }

            return numId;
        });

        return _.uniq(parsedIds);
    })
    readonly ids!: number[];

    @IsNotEmpty({ message: 'The "type" parameter is required' })
    @IsString({ message: 'The "type" parameter must be a string' })
    @MaxLength(20, { message: 'Pokemon type cannot be longer than 20 characters' })
    @Matches(/^[a-zA-Z]+$/, { message: 'Pokemon type must contain only letters' })
    @Transform(({ value }: TransformFnParams): string => {
        if (typeof value !== 'string') {
            throw new InvalidParameterError('The "type" parameter must be a string');
        }
        return value.toLowerCase().trim();
    })
    readonly type!: string;
}