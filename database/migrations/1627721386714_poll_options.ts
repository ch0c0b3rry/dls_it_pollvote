import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class PollOptions extends BaseSchema {
  protected tableName = 'poll_options'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').nullable()
      table.integer('poll_id').nullable()
      table.string('title', 255).nullable()
      table.integer('votes_count').nullable().defaultTo(0)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
