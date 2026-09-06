import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { noteCreateSchema } from '../activities/schema.js';
import { applicationController } from './controller.js';
import {
  applicationCreateSchema,
  applicationIdParams,
  applicationListQuery,
  applicationUpdateSchema,
  reorderSchema,
} from './schema.js';

export const applicationRoutes = Router();

// Static paths first so they are not swallowed by /:id.
applicationRoutes.get('/board', applicationController.board);
applicationRoutes.post('/reorder', validate({ body: reorderSchema }), applicationController.reorder);

applicationRoutes.get('/', validate({ query: applicationListQuery }), applicationController.list);
applicationRoutes.post('/', validate({ body: applicationCreateSchema }), applicationController.create);

applicationRoutes.get('/:id', validate({ params: applicationIdParams }), applicationController.get);
applicationRoutes.patch(
  '/:id',
  validate({ params: applicationIdParams, body: applicationUpdateSchema }),
  applicationController.update,
);
applicationRoutes.delete('/:id', validate({ params: applicationIdParams }), applicationController.remove);

applicationRoutes.get('/:id/timeline', validate({ params: applicationIdParams }), applicationController.timeline);
applicationRoutes.post(
  '/:id/notes',
  validate({ params: applicationIdParams, body: noteCreateSchema }),
  applicationController.addNote,
);
