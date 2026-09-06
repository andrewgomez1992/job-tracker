import { asyncHandler } from '../../middleware/asyncHandler.js';
import { activityService } from './service.js';

export const activityController = {
  recent: asyncHandler((req, res) => res.json({ data: activityService.listRecent(req.query.limit) })),
  remove: asyncHandler((req, res) => {
    activityService.remove(req.params.id);
    res.status(204).end();
  }),
};
