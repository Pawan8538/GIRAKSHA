import api from '../lib/api';

export const taskService = {
    // Get all tasks (Admin)
    getAllTasks: async () => {
        const response = await api.get('/tasks/all');
        return response.data.data;
    },

    // Get my tasks (Worker - not used in web-app usually, but good to have)
    getMyTasks: async (status = '') => {
        const params = status ? { status } : {};
        const response = await api.get('/tasks/mine', { params });
        return response.data.data;
    },

    // Get task details
    getTaskById: async (taskId) => {
        const response = await api.get(`/tasks/${taskId}`);
        return response.data.data;
    },

    // Create a new task (Admin)
    createTask: async (taskData) => {
        // Expected data: { title, description, assigned_to, slope_id }
        const response = await api.post('/tasks', taskData);
        return response.data.data;
    },

    // Update task status (Worker)
    updateStatus: async (taskId, status, comment, attachmentUrl = null) => {
        const response = await api.post(`/tasks/${taskId}/status`, {
            status,
            comment,
            attachmentUrl
        });
        return response.data.data;
    },

    // Upload attachment
    uploadAttachment: async (taskId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    }
};
