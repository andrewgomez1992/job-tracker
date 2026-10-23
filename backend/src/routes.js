import { Router } from 'express';
import {
  APPLICATION_STATUSES, CONTACT_RELATIONSHIPS, DOCUMENT_KINDS, EMPLOYMENT_TYPES,
  INTERVIEW_FORMATS, INTERVIEW_OUTCOMES, WORK_MODES,
} from './lib/constants.js';
import { activityRoutes } from './modules/activities/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { applicationRoutes } from './modules/applications/routes.js';
import { companyRoutes } from './modules/companies/routes.js';
import { contactRoutes } from './modules/contacts/routes.js';
import { documentRoutes } from './modules/documents/routes.js';
import { interviewRoutes } from './modules/interviews/routes.js';
import { reminderRoutes } from './modules/reminders/routes.js';
import { storyRoutes } from './modules/stories/routes.js';
import { env } from './config/env.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) =>
  res.json({ data: { status: 'ok', time: new Date().toISOString() } }));

/** The frontend reads its dropdown options from here instead of hard-coding them. */
apiRouter.get('/meta', (_req, res) =>
  res.json({
    data: {
      demo: env.demoMode,
      applicationStatuses: APPLICATION_STATUSES,
      workModes: WORK_MODES,
      employmentTypes: EMPLOYMENT_TYPES,
      contactRelationships: CONTACT_RELATIONSHIPS,
      interviewFormats: INTERVIEW_FORMATS,
      interviewOutcomes: INTERVIEW_OUTCOMES,
      documentKinds: DOCUMENT_KINDS,
    },
  }));

apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/interviews', interviewRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/activities', activityRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/reminders', reminderRoutes);
apiRouter.use('/stories', storyRoutes);
