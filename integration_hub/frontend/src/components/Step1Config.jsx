import React, { useEffect, useState } from 'react';
import { IntegrationService } from '../services/api';

const Step1Config = ({ data, onChange, profiles }) => {
    // Profiles passed from parent

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const sources = profiles.filter(p => p.type === 'SOURCE');
    const targets = profiles.filter(p => p.type === 'TARGET');

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Sync Shopify Orders to ERP"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source System</label>
                    <select
                        value={data.source_id}
                        onChange={(e) => handleChange('source_id', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="">Select Source...</option>
                        {sources.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Module</label>
                    <select
                        value={data.target_id}
                        onChange={(e) => handleChange('target_id', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="">Select Target...</option>
                        {targets.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                    value={data.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>
        </div>
    );
};

export default Step1Config;
