import React, { useEffect, useState } from 'react';
import { IntegrationService } from '../services/api';
import { Plus, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MappingsList = () => {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        IntegrationService.getTemplates().then(res => setTemplates(res.data));
    };

    const handleDelete = async (id) => {
        // DEBUG: Check if function is called
        if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            console.log('Attempting to delete:', id);
            try {
                await IntegrationService.deleteTemplate(id);
                console.log('Deleted successfully');
                loadData();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Error deleting template: ' + (error.response?.data?.detail || error.message));
            }
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Mappings</h2>
                    <p className="text-slate-500 mt-1">Manage integration templates</p>
                </div>
                <Link to="/templates/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                    <Plus size={20} />
                    New Template
                </Link>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="space-y-3">
                    {templates.length === 0 ? <p className="text-slate-400">No templates found.</p> : templates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <div className="font-semibold text-slate-700">
                                    <span className="text-slate-400 mr-2">#{t.id}</span>
                                    {t.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {t.source_details?.name || 'Src'} <ArrowRight className="inline mx-1" size={12} /> {t.target_details?.name || 'Tgt'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">v{t.active_version_details?.version_number || '1'}</span>
                                <Link to={`/templates/${t.id}/edit`} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Edit Template">
                                    <Pencil size={18} />
                                </Link>
                                <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Delete Template">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MappingsList;
