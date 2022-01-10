import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

/**
 * Handle user login and logout requests.
 */
export default class LoginController {
    /**
     * Show form to login
     */
    public async create({view}: HttpContextContract) {
        return view.render('pages/login')
    }

    /**
     * Handle login form submissions
     */
    public async store({request, response, auth}: HttpContextContract) {
        /**
         * Attempt to login the user with the email and password. The
         * "auth.attempt" method will perform all the required
         * validations.
         */
        await auth.attempt(request.input('email'), request.input('password'))

        /**
         * Redirect to the home page
         */
        response.redirect('/')
    }

    /**
     * Destroy user session (aka logout)
     */
    public async destroy({auth, response}: HttpContextContract) {
        await auth.logout()
        response.redirect('/')
    }

    public async login({ally}: HttpContextContract) {
        return ally.use('google').redirect()
    }

    public async callback({response, ally, auth}: HttpContextContract) {
        try {
            const google = ally.use('google')
            if (google.accessDenied()) {
                return 'Access was denied'
            }

            if (google.stateMisMatch()) {
                return 'Request expired. Retry again'
            }

            if (google.hasError()) {
                return google.getError()
            }

            const googleUser = await google.user()

            const email:string = googleUser.email!
            const fullName:string = googleUser.name!
            const avatar:string = googleUser.avatarUrl!
            const token:string = googleUser.token.token

            /**
             * Find the user by email or create
             * a new one
             */
            const user = await User.firstOrCreate({
                email: email,
            }, {
                email, fullName, token, avatar
            })

            /**
             * Login user using the web guard
             */
            await auth.use('web').login(user)

            response.redirect('/')
        } catch (error) {
            console.log({ error: error.response })
            response.redirect('/')
        }
    }

    public async logout({auth, response}: HttpContextContract) {
        await auth.logout()
        response.redirect('/')
    }
}
