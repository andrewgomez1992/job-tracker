import { Router } from 'express';
import { uploadDocument } from '../../lib/upload.js';
import { validate } from '../../middleware/validate.js';
import { documentController } from './controller.js';
import {
  documentCreateSchema, documentIdParams, documentListQuery, documentUpdateSchema,
} from './schema.js';

export const documentRoutes = Router();

documentRoutes.get('/', validate({ query: documentListQuery }), documentController.list);
// multer runs first so multipart text fields land in req.body before validation.
documentRoutes.post('/', uploadDocument, validate({ body: documentCreateSchema }), documentController.create);
documentRoutes.get('/:id', validate({ params: documentIdParams }), documentController.get);
documentRoutes.get('/:id/file', validate({ params: documentIdParams }), documentController.download);
documentRoutes.patch('/:id', validate({ params: documentIdParams, body: documentUpdateSchema }), documentController.update);
documentRoutes.delete('/:id', validate({ params: documentIdParams }), documentController.remove);
