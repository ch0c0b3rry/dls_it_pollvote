import {DateTime} from 'luxon'
import ColorPalette from 'App/Services/ColorPalette'

import {
    column,
    BaseModel,
    beforeCreate,
} from '@ioc:Adonis/Lucid/Orm'

export default class User extends BaseModel {
    @column({isPrimary: true})
    public id: number

    @column()
    public email: string

    @column()
    public fullName: string

    @column()
    public profileColor: string

    @column()
    public avatar: string

    @column.dateTime({autoCreate: true})
    public createdAt: DateTime

    @column.dateTime({autoCreate: true, autoUpdate: true})
    public updatedAt: DateTime

    /**
     * Extracting initials from the user fullName. We need them
     * to show on the user avatar.
     */
    public get initials() {
        const [firstName, lastName] = this.fullName.split(' ')
        return lastName
            ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
            : `${firstName.slice(0, 2)}`.toUpperCase()
    }

    /**
     * Assign a random profile color to the user
     */
    @beforeCreate()
    public static assignColor(user: User) {
        user.profileColor = ColorPalette.getRandom()
    }
}
