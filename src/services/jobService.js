import apiClient from '../api/client';

/**
 * Job service — the ONLY module responsible for job API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + JobController):
 *   GET  /jobs        public browse of open jobs
 *   GET  /jobs/{id}   public detail of an open job (404 otherwise)
 *
 * Employer job management (store/update/destroy/close/reopen) and proposal
 * endpoints exist on the backend but are intentionally NOT exposed here yet —
 * they belong to the employer marketplace / proposals phases.
 */

/** Query params the backend accepts on GET /jobs (whitelisted, not guessed). */
const INDEX_PARAMS = [
  'search',
  'category_id',
  'skill_id',
  'budget_type',
  'experience_level',
  'location_type',
  'location',
  'min_budget',
  'max_budget',
  'sort',
  'page',
];

/** Drop empty values so unsupported params are never sent. */
function cleanParams(params = {}) {
  const cleaned = {};
  INDEX_PARAMS.forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

export const jobService = {
  /** Browse open jobs with the supported filters. */
  getJobs: async (params = {}) => {
    const response = await apiClient.get('/jobs', { params: cleanParams(params) });
    return response.data; // { success, message, data, meta }
  },

  /** Fetch a single job by its numeric id. */
  getJob: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data; // { success, message, data }
  },
};

export default jobService;
