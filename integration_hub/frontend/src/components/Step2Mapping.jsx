import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Wand2, X, Sparkles, Check, Loader2, FileJson } from 'lucide-react';
import { IntegrationService } from '../services/api';

const Step2Mapping = ({ rules, onChange, sourceSchema, targetSchema }) => {
    const [showAutoMapModal, setShowAutoMapModal] = useState(false);
    const [detectedFields, setDetectedFields] = useState([]);
    const [mappingSuggestions, setMappingSuggestions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');

    const handleAddRule = () => {
        const newId = Math.max(...rules.map(r => r.id || 0), 0) + 1;
        onChange([...rules, { id: newId, source_path: '', target_field: '', transform: '' }]);
    };

    const handleRemoveRule = (id) => {
        onChange(rules.filter(r => r.id !== id));
    };

    const handleUpdateRule = (id, field, value) => {
        onChange(rules.map(r => {
            if (r.id === id) {
                // Remove AI badge when user edits the field
                const updated = { ...r, [field]: value };
                delete updated.ai_suggested;
                delete updated.ai_confidence;
                return updated;
            }
            return r;
        }));
    };

    const transformations = [
        'UPPERCASE', 'LOWERCASE', 'TRIM', 'REMOVE_PUNCTUATION',
        'ROUND(2)', 'DATE_FORMAT(%Y-%m-%d)', 'DEFAULT(0)'
    ];

    // Schema-to-Schema Auto-Mapping
    const handleSchemaAutoMap = async () => {
        if (!sourceSchema?.fields || !targetSchema?.fields) {
            alert('É necessário ter campos definidos no Source e Target para usar o auto-mapping.');
            return;
        }

        setIsProcessing(true);
        setProcessingStep('Analisando schemas com IA...');

        try {
            const formData = new FormData();
            formData.append('source_fields', JSON.stringify(sourceSchema.fields));
            formData.append('target_fields', JSON.stringify(targetSchema.fields));

            setProcessingStep('Gerando sugestões de mapeamento...');

            const response = await IntegrationService.autoMap(formData);
            const data = response.data;

            setDetectedFields(targetSchema.fields);
            setMappingSuggestions(data.suggestions || []);

        } catch (error) {
            console.error('Auto-mapping error:', error);
            alert('Erro ao processar: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    };

    const handleAcceptSuggestion = (suggestion) => {
        const newId = Math.max(...rules.map(r => r.id || 0), 0) + 1;
        onChange([...rules, {
            id: newId,
            source_path: suggestion.source_path,
            target_field: suggestion.target_field,
            transform: suggestion.transform || '',
            ai_confidence: suggestion.confidence,
            ai_suggested: true
        }]);
        setMappingSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const handleAcceptAll = () => {
        let currentMaxId = Math.max(...rules.map(r => r.id || 0), 0);
        const newRules = mappingSuggestions.map((suggestion, index) => ({
            id: currentMaxId + index + 1,
            source_path: suggestion.source_path,
            target_field: suggestion.target_field,
            transform: suggestion.transform || '',
            ai_confidence: suggestion.confidence,
            ai_suggested: true
        }));
        onChange([...rules, ...newRules]);
        setMappingSuggestions([]);
        setShowAutoMapModal(false);
    };

    const handleCloseModal = () => {
        setShowAutoMapModal(false);
        setDetectedFields([]);
        setMappingSuggestions([]);
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-orange-600 bg-orange-50 border-orange-200';
    };

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

            {/* Auto-Mapping Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAutoMapModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-purple-200 transition-all hover:scale-105"
                >
                    <Wand2 size={18} />
                    Auto-Mapping (IA)
                    <Sparkles size={14} className="animate-pulse" />
                </button>
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
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={rule.source_path}
                                            onChange={(e) => handleUpdateRule(rule.id, 'source_path', e.target.value)}
                                            placeholder="$.data.field"
                                            list="source-fields"
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono text-xs"
                                        />
                                        {rule.ai_suggested && (
                                            <span className={`shrink-0 text-xs px-2 py-1 rounded border ${getConfidenceColor(rule.ai_confidence)}`}>
                                                IA {rule.ai_confidence}%
                                            </span>
                                        )}
                                    </div>
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

            {/* Auto-Mapping Modal */}
            {showAutoMapModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Wand2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Auto-Mapping com IA</h3>
                                    <p className="text-purple-100 text-sm">Mapeamento automático baseado nos schemas</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/70 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                        <FileJson size={18} />
                                        Campos Disponíveis
                                    </h4>

                                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-2">SOURCE ({sourceSchema?.fields?.length || 0} campos)</p>
                                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                                {sourceSchema?.fields?.map((field, idx) => (
                                                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">
                                                        {field}
                                                    </span>
                                                )) || <span className="text-slate-400 text-sm">Nenhum campo definido</span>}
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-200 pt-3">
                                            <p className="text-xs text-slate-500 font-medium mb-2">TARGET ({targetSchema?.fields?.length || 0} campos)</p>
                                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                                {targetSchema?.fields?.map((field, idx) => (
                                                    <span key={idx} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-mono">
                                                        {field}
                                                    </span>
                                                )) || <span className="text-slate-400 text-sm">Nenhum campo definido</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {!isProcessing && mappingSuggestions.length === 0 && (
                                        <button
                                            onClick={handleSchemaAutoMap}
                                            disabled={!sourceSchema?.fields?.length || !targetSchema?.fields?.length}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Sparkles size={18} />
                                            Gerar Mapeamento com IA
                                        </button>
                                    )}

                                    {isProcessing && (
                                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center gap-3">
                                            <Loader2 size={20} className="text-purple-600 animate-spin" />
                                            <span className="text-purple-700 font-medium">{processingStep}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions */}
                                <div className="space-y-4">
                                    {mappingSuggestions.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                                    <Sparkles size={18} className="text-purple-600" />
                                                    Sugestões de Mapeamento ({mappingSuggestions.length})
                                                </h4>
                                                <button
                                                    onClick={handleAcceptAll}
                                                    className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Check size={16} /> Aceitar Todos
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {mappingSuggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                                                <code className="bg-blue-50 px-2 py-0.5 rounded text-blue-700 text-xs truncate max-w-[150px]" title={suggestion.source_path}>
                                                                    {suggestion.source_path}
                                                                </code>
                                                                <span className="text-slate-400">→</span>
                                                                <code className="bg-green-50 px-2 py-0.5 rounded text-green-700 text-xs">
                                                                    {suggestion.target_field}
                                                                </code>
                                                            </div>
                                                            {suggestion.transform && (
                                                                <div className="text-xs text-purple-600 mt-1">
                                                                    Transform: {suggestion.transform}
                                                                </div>
                                                            )}
                                                            {suggestion.reasoning && (
                                                                <div className="text-xs text-slate-500 mt-1 truncate" title={suggestion.reasoning}>
                                                                    {suggestion.reasoning}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <span className={`text-xs px-2 py-1 rounded border ${getConfidenceColor(suggestion.confidence)}`}>
                                                                {suggestion.confidence}%
                                                            </span>
                                                            <button
                                                                onClick={() => handleAcceptSuggestion(suggestion)}
                                                                className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!isProcessing && mappingSuggestions.length === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            <Wand2 size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>Clique em "Gerar Mapeamento com IA"</p>
                                            <p className="text-sm">para analisar os schemas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step2Mapping;
