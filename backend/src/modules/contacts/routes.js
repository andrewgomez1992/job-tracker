import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { contactController } from './controller.js';
import { contactCreateSchema, contactIdParams, contactListQuery, contactUpdateSchema } from './schema.js';

export const contactRoutes = Router();

contactRoutes.get('/', validate({ query: contactListQuery }), contactController.list);
contactRoutes.post('/', validate({ body: contactCreateSchema }), contactController.create);
contactRoutes.get('/:id', validate({ params: contactIdParams }), contactController.get);
contactRoutes.patch('/:id', validate({ params: contactIdParams, body: contactUpdateSchema }), contactController.update);
contactRoutes.delete('/:id', validate({ params: contactIdParams }), contactController.remove);
