import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Polls extends BaseSchema {
  protected tableName = 'polls'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').nullable()
      table.integer('user_id').nullable()
      table.string('title', 255).nullable()
      table.string('poll_color', 7).nullable()
      table.string('slug', 255).unique().nullable()
      table.timestamp('closes_at').nullable()

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
