/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
|
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

/**
 * All params named ":id" should be valid numbers.
 */
Route.where('id', Route.matchers.number())

Route.get('login', 'LoginController.login').middleware('guest')
Route.get('logout', 'LoginController.logout').middleware('auth')
Route.get('/google/callback', 'LoginController.callback')

/**
 * Home page to list all polls
 */
Route.get('/', 'PollsController.index')

/**
 * View self profile. "/me" is a convention to show details
 * for the currently logged-in user
 */
Route.get('/me', 'ProfileController.index').middleware('auth')
Route.post('/me/avatar', 'ProfileController.updateAvatar').middleware('auth')

/**
 * Polls resource management. One should be logged-in to interact
 * with polls, except viewing a poll.
 */
Route.get('polls/create', 'PollsController.create').middleware('auth')
Route.post('polls', 'PollsController.store').middleware('auth')
Route.get('polls/:slug', 'PollsController.show')
Route.get('poll/result/:slug', 'PollsController.result').as('pollResult')
Route.post('polls/vote', 'PollsController.submitVote').as('postSubmit').middleware('auth')
Route.delete('polls/:id', 'PollsController.destroy').middleware('auth')