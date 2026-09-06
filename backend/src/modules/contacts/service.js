import { ApiError } from '../../lib/ApiError.js';
import { db } from '../../db/index.js';
import { activityService } from '../activities/service.js';
import { contactRepository } from './repository.js';

const serialize = (row) =>
  row && {
    id: row.id,
    name: row.name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedin_url,
    relationship: row.relationship,
    lastContactedAt: row.last_contacted_at,
    notes: row.notes,
    companyId: row.company_id,
    companyName: row.company_name,
    applicationId: row.application_id,
    applicationRole: row.application_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const toRow = (input) => {
  const map = {
    companyId: 'company_id', applicationId: 'application_id', name: 'name', title: 'title',
    email: 'email', phone: 'phone', linkedinUrl: 'linkedin_url', relationship: 'relationship',
    lastContactedAt: 'last_contacted_at', notes: 'notes',
  };
  const row = {};
  for (const [from, to] of Object.entries(map)) if (input[from] !== undefined) row[to] = input[from];
  return row;
};

export const contactService = {
  list: (filters) => contactRepository.list(filters).map(serialize),

  get(id) {
    const row = contactRepository.findById(id);
    if (!row) throw ApiError.notFound('Contact');
    return serialize(row);
  },

  create(payload) {
    const run = db.transaction(() => {
      const created = contactRepository.create(toRow(payload));
      if (created.application_id) {
        activityService.record({
          applicationId: created.application_id,
          type: 'contact_added',
          message: `Added contact ${created.name}`,
          payload: { contactId: created.id },
        });
      }
      return created;
    });
    return serialize(run());
  },

  update(id, patch) {
    contactService.get(id);
    return serialize(contactRepository.update(id, toRow(patch)));
  },

  remove(id) {
    contactService.get(id);
    contactRepository.remove(id);
  },
};
