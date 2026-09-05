import apiClient from '../api/client';

/**
 * contactService — public Contact form submissions + the admin Contacts inbox.
 *
 * Public:
 *   POST  /contact-messages          — save a visitor's contact message
 * Admin (every call requires the contacts.manage permission):
 *   GET    /admin/contacts           — paginated inbox (status/search filters)
 *   GET    /admin/contacts/:id       — single message (marks it read)
 *   PATCH  /admin/contacts/:id       — mark read / resolve / reopen
 *   DELETE /admin/contacts/:id       — remove a message
 *
 * Every method returns response.data (the full Laravel envelope).
 */
export const contactService = {
  /** POST /contact-messages — save a public Contact form submission. */
  sendMessage: async (payload) => {
    const res = await apiClient.post('/contact-messages', payload);
    return res.data;
  },

  // ── Admin inbox ───────────────────────────────────────────────────────

  /** GET /admin/contacts — paginated contact messages. */
  getContacts: async (params = {}) => {
    const res = await apiClient.get('/admin/contacts', { params });
    return res.data;
  },

  /** GET /admin/contacts/:id — single message (server marks it as read). */
  getContactById: async (id) => {
    const res = await apiClient.get(`/admin/contacts/${id}`);
    return res.data;
  },

  /** PATCH /admin/contacts/:id — { status: 'read'|'resolved', resolution? }. */
  updateContactStatus: async (id, payload) => {
    const res = await apiClient.patch(`/admin/contacts/${id}`, payload);
    return res.data;
  },

  /** DELETE /admin/contacts/:id — remove a contact message. */
  deleteContact: async (id) => {
    const res = await apiClient.delete(`/admin/contacts/${id}`);
    return res.data;
  },
};

export default contactService;
