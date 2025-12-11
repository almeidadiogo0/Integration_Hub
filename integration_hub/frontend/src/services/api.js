import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const IntegrationService = {
    getProfiles: () => api.get('profiles/'),
    getTemplates: () => api.get('templates/'),
    getTemplate: (id) => api.get(`templates/${id}/`),
    createTemplate: (data) => api.post('templates/', data),
    updateTemplate: (id, data) => api.patch(`templates/${id}/`, data),
    deleteTemplate: (id) => api.delete(`templates/${id}/`),
    createVersion: (data) => api.post('versions/', data),
    executeTemplate: (id, inputData) => api.post(`templates/${id}/execute/`, { data: inputData }),
    getLogs: () => api.get('logs/'),
};

export default api;
