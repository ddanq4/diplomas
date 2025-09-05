import api from './api';

export const listInvites = () =>
    api.get('/invites').then(r => r.data);

export const createInvite = (minutes) =>
    api.post('/invites', { minutes }).then(r => r.data);

export const revokeInvite = (key) =>
    api.delete(`/invites/${encodeURIComponent(key)}`).then(r => r.data);
