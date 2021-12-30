import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class PollUserVotes extends BaseSchema {
  protected tableName = 'poll_user_votes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').nullable()
      table.integer('poll_id').nullable()
      table.integer('user_id').nullable()
      table.integer('option_id').nullable()

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
