import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { activityController } from './controller.js';
import { activityIdParams, activityListQuery } from './schema.js';

export const activityRoutes = Router();

activityRoutes.get('/', validate({ query: activityListQuery }), activityController.recent);
activityRoutes.delete('/:id', validate({ params: activityIdParams }), activityController.remove);
