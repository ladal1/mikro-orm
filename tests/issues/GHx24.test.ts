import {
  Entity,
  PrimaryKey,
  Property,
  MikroORM,
  EntityManager,
} from '@mikro-orm/sqlite';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property({ default: 'temporary name', nullable: true })
  name?: string = 'temporary name';

  // Without constructor setter
  @Property({ nullable: true, default: 'Anonymous author' })
  author?: string;

}

let orm: MikroORM;
let orm2: MikroORM;

async function createTestData(em: EntityManager) {
  em.create(Book, { name: 'R.U.R.', author: 'Karel Čapek' });
  em.create(Book, {});
  em.create(Book, { name: null, author: null }, {});

  await em.flush();
  em.clear();
}

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book],
    dbName: ':memory:',
    // forceUndefined: true,
  });
  orm2 = await MikroORM.init({
    entities: [Book],
    dbName: ':memory:',
    forceUndefined: true,
  });
  await orm.schema.createSchema();
  await orm2.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
  await orm2.close(true);
});

test(`Nullable column with default value without forceUndefined`, async () => {
  const em = orm.em.fork();

  await createTestData(em);

  // Query all books, one should be named "R.U.R.", one should be named "temporary name" and last one should have name be undefined
  const books = await em.find(
    Book,
    {},
    {
      orderBy: [{ id: 'ASC' }],
    },
  );
  expect(books).toHaveLength(3);
  expect(books[0].name).toBe('R.U.R.');
  expect(books[1].name).toBe('temporary name');
  expect(books[2].name).toBeNull();
  expect(books[0].author).toBe('Karel Čapek');
  expect(books[1].author).toBe('Anonymous author');
  expect(books[2].author).toBeNull();
});

test(`Nullable column with default value with forceUndefined`, async () => {
  const em = orm2.em.fork();

  await createTestData(em);

  // Query all books, one should be named "R.U.R.", one should be named "temporary name" and last one should have name be undefined
  const books = await em.find(
    Book,
    {},
    {
      orderBy: [{ id: 'ASC' }],
    },
  );
  expect(books).toHaveLength(3);
  expect(books[0].name).toBe('R.U.R.');
  expect(books[1].name).toBe('temporary name');
  expect(books[2].name).toBeUndefined();
  expect(books[0].author).toBe('Karel Čapek');
  expect(books[1].author).toBe('Anonymous author');
  expect(books[2].author).toBeUndefined();
});
