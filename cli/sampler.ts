import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { faker } from '@faker-js/faker';
import { error, log } from '@lib/logger';
import type { Command } from 'commander';
import { ensureDirSync } from 'fs-extra';

type PetOwner = {
    id: string;
    name: string;
    zipcode: string;
};

type Animal = {
    id: string;
    type: string;
    subtype: string;
};

type Pet = {
    id: string;
    owner_id: string;
    animal_id: string;
    name: string;
    dob: Date;
};

const createOwners = (): { headers: string[]; rows: PetOwner[] } => {
    const rows = [];
    for (let i = 0; i < 100; i++) {
        rows.push({
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            zipcode: faker.location.zipCode(),
        });
    }
    return {
        headers: ['id', 'name', 'zipcode'],
        rows,
    };
};

export const generateRandomAnimal = (): { type: string; name: string } => {
    const types = [
        'bear',
        'bird',
        'cat',
        'cow',
        'crocodilia',
        'dog',
        'fish',
        'horse',
        'insect',
        'lion',
        'rabbit',
        'rodent',
        'snake',
    ] as const;
    const type = faker.helpers.arrayElement(types);
    const name = faker.animal[type]();
    return { type, name };
};

const createAnimals = (): { headers: string[]; rows: Animal[] } => {
    const rows = [];
    for (let i = 0; i < 18; i++) {
        const animal = generateRandomAnimal();
        rows.push({
            id: faker.string.uuid(),
            type: animal.type,
            subtype: animal.name,
        });
    }
    return {
        headers: ['id', 'type', 'subtype'],
        rows,
    };
};

const createPets = (petOwners: PetOwner[], animals: Animal[]): { headers: string[]; rows: Pet[] } => {
    const rows: Pet[] = [];
    for (const petOwner of petOwners) {
        const numPets = faker.number.int({ min: 1, max: 5 });
        for (let i = 0; i < numPets; i++) {
            rows.push({
                id: faker.string.uuid(),
                owner_id: petOwner.id,
                animal_id: faker.helpers.arrayElement(animals).id,
                name: faker.animal.petName(),
                dob: faker.date.past({ years: 7 }),
            });
        }
    }
    return {
        headers: ['id', 'owner_id', 'animal_id', 'name', 'dob'],
        rows,
    };
};

const writeCsv = <T extends Record<string, unknown>>(filePath: string, headers: string[], rows: T[]) => {
    try {
        const lines = [headers.join(',')];
        for (const row of rows) {
            lines.push(headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
        }
        writeFileSync(filePath, lines.join('\n'), 'utf8');
        log(`📝 Wrote ${rows.length} rows to ${filePath}`, { tag: 'writeCsv' });
    } catch (err) {
        error('❌ Failed to write CSV file', {
            tag: 'writeCsv',
            data: { filePath, error: String(err) },
        });
        throw err;
    }
};

export const registerSamplerCommand = (program: Command) => {
    program
        .command('sampler <dir>')
        .description('Creates sample csv files in a directory')
        .action(async (inputDir: string) => {
            const absPath = resolve(inputDir);
            const petOwnersDir = join(absPath, 'pet-owners');

            log('Creating sample CSV files...', { tag: 'sampler' });
            log('Output directory resolved', { tag: 'sampler', data: { absPath } });

            ensureDirSync(petOwnersDir);

            const owners = createOwners();
            const animals = createAnimals();
            const pets = createPets(owners.rows, animals.rows);

            writeCsv(join(petOwnersDir, 'owners.csv'), owners.headers, owners.rows);
            writeCsv(join(petOwnersDir, 'animals.csv'), animals.headers, animals.rows);
            writeCsv(join(petOwnersDir, 'pets.csv'), pets.headers, pets.rows);

            log('✅ Sample CSV files created successfully', { tag: 'sampler' });
        });
};
