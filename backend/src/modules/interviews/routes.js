import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { interviewController } from './controller.js';
import {
  interviewCreateSchema, interviewIdParams, interviewListQuery, interviewUpdateSchema,
} from './schema.js';

export const interviewRoutes = Router();

interviewRoutes.get('/', validate({ query: interviewListQuery }), interviewController.list);
interviewRoutes.post('/', validate({ body: interviewCreateSchema }), interviewController.create);
interviewRoutes.get('/:id', validate({ params: interviewIdParams }), interviewController.get);
interviewRoutes.patch('/:id', validate({ params: interviewIdParams, body: interviewUpdateSchema }), interviewController.update);
interviewRoutes.delete('/:id', validate({ params: interviewIdParams }), interviewController.remove);
