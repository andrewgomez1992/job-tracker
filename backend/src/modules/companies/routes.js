import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { companyController } from './controller.js';
import {
  companyCreateSchema,
  companyIdParams,
  companyListQuery,
  companyUpdateSchema,
} from './schema.js';

export const companyRoutes = Router();

companyRoutes.get('/', validate({ query: companyListQuery }), companyController.list);
companyRoutes.post('/', validate({ body: companyCreateSchema }), companyController.create);
companyRoutes.get('/:id', validate({ params: companyIdParams }), companyController.get);
companyRoutes.patch(
  '/:id',
  validate({ params: companyIdParams, body: companyUpdateSchema }),
  companyController.update,
);
companyRoutes.delete('/:id', validate({ params: companyIdParams }), companyController.remove);
