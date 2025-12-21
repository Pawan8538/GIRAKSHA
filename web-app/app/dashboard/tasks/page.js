"use client";

import { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import { dashboardService } from '@/services/dashboardService';
import { Card, CardContent } from '@/components/common/Card';
import { Plus, Filter, Calendar, User, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [mines, setMines] = useState([]);
    const [filter, setFilter] = useState('all');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        slope_id: '',
        priority: 'medium'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tasksData, workersData, minesData] = await Promise.all([
                taskService.getAllTasks().catch(() => []),
                dashboardService.getWorkers().catch(() => []), // Assuming getWorkers works generally or needs slopeId
                dashboardService.getMines().catch(() => [])
            ]);

            // If getWorkers requires slopeId, we might need a different approach or fetch all workers
            // For now assuming getWorkers returns all workers for admin

            setTasks(tasksData || []);
            setWorkers(workersData || []);
            setMines(minesData || []);
        } catch (error) {
            console.error("Error loading tasks data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await taskService.createTask(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', assigned_to: '', slope_id: '', priority: 'medium' });
            loadData();
        } catch (error) {
            console.error("Failed to create task:", error);
            alert("Failed to create task");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return CheckCircle;
            case 'in_progress': return Clock;
            default: return AlertCircle;
        }
    };

    const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto">
                {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Tasks Grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => {
                        const StatusIcon = getStatusIcon(task.status);
                        return (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(task.status)} capitalize`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {task.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(task.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">
                                                {workers.find(w => w.id === task.assigned_to)?.name || 'Unknown Worker'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">
                                                {mines.find(m => m.id === task.slope_id)?.name || 'Unknown Mine'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Assign New Task</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mine Site</label>
                                    <select
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.slope_id}
                                        onChange={e => setFormData({ ...formData, slope_id: e.target.value })}
                                    >
                                        <option value="">Select Mine</option>
                                        {mines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
                                    <select
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.assigned_to}
                                        onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                    >
                                        <option value="">Select Worker</option>
                                        {workers.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
