import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

const Step2Mapping = ({ rules, onChange, sourceSchema, targetSchema }) => {
    const handleAddRule = () => {
        const newId = Math.max(...rules.map(r => r.id || 0), 0) + 1;
        onChange([...rules, { id: newId, source_path: '', target_field: '', transform: '' }]);
    };

    const handleRemoveRule = (id) => {
        onChange(rules.filter(r => r.id !== id));
    };

    const handleUpdateRule = (id, field, value) => {
        onChange(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const transformations = [
        'UPPERCASE', 'LOWERCASE', 'TRIM', 'REMOVE_PUNCTUATION',
        'ROUND(2)', 'DATE_FORMAT(%Y-%m-%d)', 'DEFAULT(0)'
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-700">
                <HelpCircle className="shrink-0" size={20} />
                <div>
                    <p className="font-semibold">Mapping Instructions</p>
                    <p>Enter the JSON Path for the source (e.g. <code>$.company.name</code>) and the Destination Field Name.</p>
                    <p>Optional: Apply transformation functions like <code>UPPERCASE</code>, <code>DATE_FORMAT</code>, etc.</p>
                </div>
            </div>

            {/* Suggestions Datalists */}
            <datalist id="source-fields">
                {sourceSchema?.fields?.map(f => (
                    <option key={f} value={f.startsWith('$.') ? f : `$.${f}`} />
                ))}
            </datalist>
            <datalist id="target-fields">
                {targetSchema?.fields?.map(f => (
                    <option key={f} value={f} />
                ))}
            </datalist>
            <datalist id="transformations">
                {transformations.map(t => (
                    <option key={t} value={t} />
                ))}
            </datalist>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-[35%]">Source JSON Path</th>
                            <th className="p-4 w-[25%]">Transformation</th>
                            <th className="p-4 w-[35%]">Target Field</th>
                            <th className="p-4 w-[5%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-50 group">
                                <td className="p-2">
                                    <input
                                        type="text"
                                        value={rule.source_path}
                                        onChange={(e) => handleUpdateRule(rule.id, 'source_path', e.target.value)}
                                        placeholder="$.data.field"
                                        list="source-fields"
                                        className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono text-xs"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        value={rule.transform}
                                        onChange={(e) => handleUpdateRule(rule.id, 'transform', e.target.value)}
                                        placeholder="UPPERCASE"
                                        list="transformations"
                                        className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono text-xs text-purple-600"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        value={rule.target_field}
                                        onChange={(e) => handleUpdateRule(rule.id, 'target_field', e.target.value)}
                                        placeholder="db_column_name"
                                        list="target-fields"
                                        className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono text-xs"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => handleRemoveRule(rule.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Remove Rule"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rules.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        No mapping rules defined yet.
                    </div>
                )}
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={handleAddRule}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                        <Plus size={16} /> Add Mapping Rule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step2Mapping;
