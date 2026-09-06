import { ApiError } from '../../lib/ApiError.js';
import { companyRepository } from './repository.js';

const serialize = (row) =>
  row && {
    id: row.id,
    name: row.name,
    website: row.website,
    industry: row.industry,
    location: row.location,
    notes: row.notes,
    applicationCount: row.application_count ?? 0,
    contactCount: row.contact_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

export const companyService = {
  list: (query) => companyRepository.list(query).map(serialize),

  get(id) {
    const row = companyRepository.findById(id);
    if (!row) throw ApiError.notFound('Company');
    return serialize(row);
  },

  create(payload) {
    if (companyRepository.findByName(payload.name)) {
      throw ApiError.conflict(`You already track a company called "${payload.name}".`);
    }
    return serialize(companyRepository.create(payload));
  },

  /** Find a company by name or create it. Used when saving an application. */
  resolveByName(name) {
    const existing = companyRepository.findByName(name);
    return existing ?? companyRepository.create({ name });
  },

  update(id, patch) {
    companyService.get(id);
    if (patch.name) {
      const clash = companyRepository.findByName(patch.name);
      if (clash && clash.id !== id) throw ApiError.conflict('Another company already uses that name.');
    }
    return serialize(companyRepository.update(id, patch));
  },

  remove(id) {
    companyService.get(id);
    companyRepository.remove(id);
  },

  serialize,
};
