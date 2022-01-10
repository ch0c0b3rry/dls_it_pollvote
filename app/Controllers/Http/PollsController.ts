import {DateTime} from 'luxon';
import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import Poll from 'App/Models/Poll';
import PollOption from "App/Models/PollOption";
import PollUserVote from "App/Models/PollUserVote";
import CreatePollValidator from 'App/Validators/CreatePollValidator';
import User from "App/Models/User";

/**
 * Controller to the polls resource
 */
export default class PollsController {
    /**
     * Show a list of all the polls. The list is filtered to show only
     * active polls (not the closed one's).
     */
    public async index({request, view, auth}: HttpContextContract) {
        const filterBy = request.input('filter_by')

        /**
         * Render an empty list of polls when "pariticapted" filter is
         * applied and the user is not logged in
         */
        if (filterBy === 'participated' && !auth.isLoggedIn) {
            return view.render('pages/polls/index', {polls: [], filterBy})
        }

        /**
         * Get the pagination page number and make sure it is a valid number. If
         * not a valid number, we fallback to 1.
         */
        let page = Number(request.input('page'))
        page = isNaN(page) ? 1 : page

        /**
         * Choose the correct query builder. If the "participated" filter is
         * applied, we use the user relationship query builder to fetch
         * polls in which the logged in user has participated.
         *
         * Otherwise we fetch all the active polls (ignoring expired one's)
         */
        const query =
            filterBy === 'participated'
                ? Poll.query().where('userId', '=', auth.user!.id)
                : Poll.query().where('closesAt', '>', DateTime.local().toISO())

        /**
         * Select all polls with an aggregate of the votes count it has
         * received
         */
        const polls = await query
            .orderBy('id', 'desc')
            .paginate(page, 10)

        /**
         * The pagination links will use the following as
         * the base url.
         *
         * We also define set the query string, since the route for this
         * controller allows "filter_by" query param.
         */
        polls.baseUrl(request.url()).queryString(request.qs())

        /**
         * Render the template stored inside "pages/polls/index.edge" file
         */
        return view.render('pages/polls/index', {polls, filterBy})
    }

    /**
     * Display the form to create a new poll
     */
    public async create({view}: HttpContextContract) {
        return view.render('pages/polls/create')
    }

    /**
     * Handle new poll form submission
     */
    public async store({request, response, auth, session}: HttpContextContract) {
        /**
         * Validate request input
         */
        const data = await request.validate(CreatePollValidator)

        /**
         * Wrap all the database queries inside a transaction. This will ensure the
         * database is always in a consistent state in case of an error
         */
        const poll = await Database.transaction(async (trx) => {
            /**
             * When persisting relationships, we need to assign the transaction
             * instance to the top level model. All the relationship methods
             * will reference the same transaction instance.
             */
            auth.user!.useTransaction(trx)

            /**
             * Create poll and link it with the currently logged in user.
             */
            const poll = await Poll.create({
                userId: auth.user!.id,
                title: data.title,
                closesAt: DateTime.local().plus({days: data.days}),
            })

            /**
             * Create poll options
             */
            let options = [] as any
            for(const option of data.options) {
                options.push({
                    pollId: poll.id || 0,
                    title: option.title
                })
            }
            await PollOption.createMany(options)

            /**
             * Return poll reference
             */
            return poll
        })

        session.flash({notification: {success: 'Poll has been created successfully'}})
        response.redirect().toRoute('PollsController.show', [poll.slug])
    }

    /**
     * Route to show an indidivual poll. We also preload the poll
     * options relationship.
     */
    public async show({request, view, auth}: HttpContextContract) {
        /**
         * Query to find a poll by slug and also preload its options and
         * the author
         */
        const poll = await Poll.query()
            .where('slug', request.param('slug'))
            .firstOrFail()

        let pollOptions = await PollOption.query().where('poll_id', poll.id)

        /**
         * Fetch the user participation row for the currently logged
         * in user and the currently selected poll.
         */
        const selectedOption = auth.user
            ? await Database
                .query()
                .where('poll_id', poll.id).where('user_id', auth.user.id)
                .from('poll_user_votes')
            : null

        const userCreate = await User.query().where('id', poll.userId).first()

        /**
         * Render the pages/polls/show template
         */
        return view.render('pages/polls/show', {poll, userCreate, pollOptions, selectedOption})
    }

    /**
     * Route to handle form submissions for voting on a poll
     */
    public async submitVote({request, auth}) {
        try {
            const requestData = request.all()
            const selectedOption = requestData.selectedOption
            const pollId = requestData.id

            /**
             * Fetch the poll instance
             */
            const poll = await Poll.findOrFail(pollId)

            /**
             * Return early when user is trying to vote on an expired poll. The UI
             * prevents this from happening but we still need to guard from
             * direct requests
             */
            if (poll.expired) {
                return {
                    code: 400,
                    message: 'Voting on this poll has been closed'
                };
            }

            const userParticipation = await PollUserVote
                .query().where('poll_id', poll.id).andWhere('user_id', auth.user!.id)
                .first()

            /**
             * Return early if the user has already participated in this poll. The
             * UI stops from this happening, but still we need to guard from
             * direct requests
             */
            if (userParticipation) {
                return {
                    code: 400,
                    message: 'You have already participated in this poll'
                };
            }

            for (let i = 0; i < selectedOption.length; i++) {
                const item = selectedOption[i]
                await PollUserVote.create({
                    pollId: pollId,
                    optionId: item.id,
                    userId: auth.user!.id,
                    note: item.note,
                })
            }

            return {
                code: 200,
                message: 'Success'
            }
        } catch (ex) {
            return {
                code: 400,
                message: ex.message
            }
        }
    }

    /**
     * Route to delete a poll by its id
     */
    public async destroy({request, response, auth, session}: HttpContextContract) {
        const poll = await Poll.find(request.param('id'))

        /**
         * Silently ignore requests trying to delete a non-existing
         * or a poll not owned by them
         */
        if (!poll || poll.userId !== auth.user!.id) {
            response.redirect().toRoute('ProfileController.index')
            return
        }

        /**
         * Delete poll and redirect
         */
        await poll.delete()
        session.flash({notification: {success: 'Poll deleted successfully'}})
        response.redirect().toRoute('ProfileController.index')
    }
}