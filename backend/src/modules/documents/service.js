import { ApiError } from '../../lib/ApiError.js';
import { db } from '../../db/index.js';
import { deleteUploadedFile } from '../../lib/upload.js';
import { activityService } from '../activities/service.js';
import { documentRepository } from './repository.js';

const serialize = (row) =>
  row && {
    id: row.id,
    applicationId: row.application_id,
    applicationRole: row.application_role,
    companyName: row.company_name,
    title: row.title,
    kind: row.kind,
    versionLabel: row.version_label,
    url: row.url,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    downloadUrl: row.file_path ? `/api/documents/${row.id}/file` : null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const toRow = (input) => {
  const map = {
    applicationId: 'application_id', title: 'title', kind: 'kind', versionLabel: 'version_label',
    url: 'url', fileName: 'file_name', filePath: 'file_path', fileSize: 'file_size',
    mimeType: 'mime_type', notes: 'notes',
  };
  const row = {};
  for (const [from, to] of Object.entries(map)) if (input[from] !== undefined) row[to] = input[from];
  return row;
};

export const documentService = {
  list: (filters) => documentRepository.list(filters).map(serialize),

  get(id) {
    const row = documentRepository.findById(id);
    if (!row) throw ApiError.notFound('Document');
    return serialize(row);
  },

  /** Raw row, including the on-disk path - used by the download route only. */
  getRaw(id) {
    const row = documentRepository.findById(id);
    if (!row) throw ApiError.notFound('Document');
    return row;
  },

  create(payload, file) {
    const run = db.transaction(() => {
      const created = documentRepository.create(
        toRow({
          ...payload,
          fileName: file?.originalname,
          filePath: file?.filename,
          fileSize: file?.size,
          mimeType: file?.mimetype,
        }),
      );
      if (created.application_id) {
        activityService.record({
          applicationId: created.application_id,
          type: 'document_added',
          message: `Attached ${created.title}`,
          payload: { documentId: created.id, kind: created.kind },
        });
      }
      return created;
    });
    return serialize(run());
  },

  update(id, patch) {
    documentService.get(id);
    return serialize(documentRepository.update(id, toRow(patch)));
  },

  remove(id) {
    const row = documentService.getRaw(id);
    documentRepository.remove(id);
    deleteUploadedFile(row.file_path);
  },
};
