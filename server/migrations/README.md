Please find the appropriate migration commands from the `migrate-mongo` package
https://www.npmjs.com/package/migrate-mongo

## Migrating as a user

#### Apply all pending migrations

    npm run migration:up

OctoFarm will do this automatically for you. The output should look similar to this:

    $ npm run migration:up
    27/07/2021, 18:54:35 | INFO | OctoFarm-Environment | ✓ Parsed environment and (optional) .env file
    27/07/2021, 18:54:35 | INFO | OctoFarm-Environment | ✓ NODE_ENV variable correctly set (development)!
    27/07/2021, 18:54:35 | INFO | OctoFarm-Environment | ✓ Running OctoFarm version 1.2.0 in non-NPM mode!
    27/07/2021, 18:54:35 | INFO | OctoFarm-Environment | ✓ MONGO environment variable set!
    MIGRATED UP: 20210713120034-printers-settingsapperance-apikey.js

This command here is a `package.json` script equivalent to `migrate-mongo up`

#### Migration status

    npm run migration:status

The output should look like the following:

    $ npm run migration:status
    27/07/2021, 19:08:40 | INFO | OctoFarm-Environment | ✓ Parsed environment and (optional) .env file
    27/07/2021, 19:08:40 | INFO | OctoFarm-Environment | ✓ NODE_ENV variable correctly set (development)!
    27/07/2021, 19:08:40 | INFO | OctoFarm-Environment | ✓ Running OctoFarm version 1.2.0 in non-NPM mode!
    27/07/2021, 19:08:40 | INFO | OctoFarm-Environment | ✓ MONGO environment variable set!
    ┌─────────────────────────────────────────────────────┬──────────────────────────┐
    │ Filename                                            │ Applied At               │
    ├─────────────────────────────────────────────────────┼──────────────────────────┤
    │ 20210713120034-printers-settingsapperance-apikey.js │ 2021-07-27T18:54:35.065Z │
    └─────────────────────────────────────────────────────┴──────────────────────────┘

If the table shows the following it means migrations are pending:

    $ npm run migration:status
    ...
    ┌─────────────────────────────────────────────────────┬────────────┐
    │ Filename                                            │ Applied At │
    ├─────────────────────────────────────────────────────┼────────────┤
    │ 20210713120034-printers-settingsapperance-apikey.js │ PENDING    │
    └─────────────────────────────────────────────────────┴────────────┘

This command here is a `package.json` script equivalent to `migrate-mongo status`.

## Commands for a (plugin) developer

We discuss create, up, down and

### Create a migration

    migrate-mongo create printers-settingsapperance-apikey

Please use lower-case and hyphens. No underscore characters. The file naming format is important as it is stored in database to track migrations state,
so please do it confirm is `YYYYMMDDHHmmSS-schema-action.js` where **schema** is your table name and the **action** is up to three words labeling the change.
**Dont change the file name after its committed/released to your users!**

For example:
I will migrate and correct two typos in the schema Printer.

1.  MongoDB has named this collection `printers`, so this is the collection name (this can be forced in your schema!).
2.  The renames we will do is correcting `settingsApperance`=>`settingsAppearance` and `apikey`=>`apiKey`
3.  The input to the create command is thus `printers-settingsapperance-apikey`

That goes like this:

    migrate-mongo create printers-settingsapperance-apikey

Which results in this output, if everything is in order:

    $ migrate-mongo create printers-settingsapperance-apikey
    Created: migrations/20210727183402-printers-settingsapperance-apikey.js

### Apply all pending migrations

    migrate-mongo up

This is similar to the User related section above, except for one thing. You as a developer have the responsibility to ensure that the migration is SAFE. Always take into account that migrations can fail in the middle of the script. Make sure your script can be run multiple times in a row without reaching a broken migration state.

Test both your `up( )` and `down( )` functions taking into account the past migrations. Discuss with your beta testers if failures occurred and fix these before releasing another version of your code. Make sure your migration heals problems in a neat, predictable and ordered manner.

#### Creating up and dealing with migration errors

The  following code shows how we can use transactions to make the operation atomic and pass possible errors down to `migrate-mongo` which will report the migration as failed.
This is not a rollback mechanism however. Read "Important notes" below on how to work with failures in mind.

    async up(db, client) {
      const session = client.startSession();
      try {
        // Safety first
        await session.withTransaction(async () => {
          // Do the migration
          const dbCollection = db.collection("printers");
          await dbCollection.updateMany({}, { $rename: { settingsApperance: "settingsAppearance" } });
          await dbCollection.updateMany({}, { $rename: { apikey: "apiKey" } });
        });
      } finally {
        session.
        await session.endSession();
      }
    }

### Revert (down) the last migration

    migrate-mongo down

This is why we need `down(...)`. You never need it ... until you do. We mostly use this during testing.

## Important notes

*   Dont forget to update the schema and application keys before you PR your migration to github!
*   The migration tool `migrate-mongo` is configured with `migrate-mongo-config.js` and our environment tools `server_src/app-env.js`.
*   Successful migrations end up in the `_migrations` table.
*   `up` is a required function for migrations, but `down` is also very important for restoring problems.
*   Making collection backups before a migration can be a good idea, but be careful with large size collection (10MB) and consider your actions carefully.

### Initiate a migration configuration

You dont need this as a developer for an existing OctoFarm setup.

> migrate-mongo init
