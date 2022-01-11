import {DateTime} from 'luxon'
import ColorPalette from 'App/Services/ColorPalette'
import {slugify} from '@ioc:Adonis/Addons/LucidSlugify'

import {
    column,
    BaseModel,
    beforeCreate,
} from '@ioc:Adonis/Lucid/Orm'

export default class Poll extends BaseModel {
    @column({isPrimary: true})
    public id: number

    @column()
    public userId: number

    @column()
    public title: string

    @column()
    public description: string

    @column()
    public pollColor: string

    @column()
    public status: number

    @column()
    public type: number

    @column()
    @slugify({
        strategy: 'dbIncrement',
        fields: ['title'],
    })
    public slug: string

    @column.dateTime()
    public closesAt: DateTime

    @column()
    public votesCount: number

    @column.dateTime({autoCreate: true})
    public createdAt: DateTime

    @column.dateTime({autoCreate: true, autoUpdate: true})
    public updatedAt: DateTime

    /**
     * Find if the poll has been expired or not
     */
    public get expired() {
        return this.closesAt.diff(DateTime.local(), 'seconds').seconds <= 0
    }

    /**
     * Assign a random color to the poll before we create
     * it.
     */
    @beforeCreate()
    public static assignColor(poll: Poll) {
        poll.pollColor = ColorPalette.getRandom()
    }
}
