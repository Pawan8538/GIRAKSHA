import api from '../lib/api';

export const complaintService = {
    // Get all complaints (Admin/Gov)
    getAllComplaints: async () => {
        const response = await api.get('/complaints');
        return response.data.data;
    },

    // Get complaint details
    getComplaintById: async (id) => {
        const response = await api.get(`/complaints/${id}`);
        return response.data.data;
    },

    // Update complaint status (Admin)
    updateStatus: async (id, status) => {
        const response = await api.patch(`/complaints/${id}/status`, { status });
        return response.data.data;
    },

    // Add feedback/reply to complaint
    addFeedback: async (id, message, workerId) => {
        const response = await api.post(`/complaints/${id}/feedback`, {
            message,
            worker_id: workerId // Optional, if replying specifically to worker
        });
        return response.data.data;
    }
};
