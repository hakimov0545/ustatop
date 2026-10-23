import { request } from '../../../shared/api/client.js';

export const getAdminDashboard = (days = 30) => request(`/api/admin/dashboard?days=${days}`);
