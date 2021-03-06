const { modelResponse } = require('../../../responses/contest');
const fetcherFactory = require('../../../plugins/fetcher/factory');

const fetcher = fetcherFactory('Contest', { relations: ['poll'] });

/**
 * @api {http.post} <prefix>.polls.stop Stop the contest
 * @apiVersion 1.0.0
 * @apiName polls.contest.stop
 * @apiGroup PollsContest
 * @apiDescription Broadcast `pollContestStoped` event with `Contest` model
 * @apiHeader Authorization JWT authorization
 * @apiSchema {jsonschema=../../../../schemas/polls.contest.stop.request.json} apiParam
 * @apiSchema {jsonschema=../../../../schemas/polls.contest.stop.response.json} apiSuccess
 */
function stopContestAction(request) {
  const { model: contest } = request;
  const { STOPPED } = this.service('contest').constructor.state;
  const { STOPPED: STOPPED_POLL } = this.service('polls').constructor.state;
  const broadcastService = this.service('broadcast');
  const { POLL_CONTEST_STOPPED } = broadcastService.constructor.events;

  return contest
    .save({ state: STOPPED })
    .then(modelResponse)
    .then((stoppedContest) => {
      // if has poll then chain the status
      if (stoppedContest.data.attributes.hasQuestions) {
        return contest.relations.poll
          .save({ state: STOPPED_POLL })
          .then(() => stoppedContest);
      }
      return stoppedContest;
    })
    .tap(stoppedContest =>
      broadcastService.fire(POLL_CONTEST_STOPPED, stoppedContest,
        stoppedContest.data.attributes.ownerId)
    )
    .tap(() => this.hook('contest:stop:post', contest));
}

function allowed(request) {
  const { model: contest, auth } = request;
  const { user } = auth.credentials;

  return this.service('allowed').hasAccess(user, contest.get('ownerId'));
}

stopContestAction.allowed = allowed;
stopContestAction.auth = 'token';
stopContestAction.fetcher = fetcher;
stopContestAction.schema = 'polls.contest.stop.request';
stopContestAction.transports = ['http'];
stopContestAction.transportsOptions = {
  http: {
    methods: ['post'],
  },
};

module.exports = stopContestAction;
