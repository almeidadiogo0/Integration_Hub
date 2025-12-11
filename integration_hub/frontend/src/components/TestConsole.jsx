import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const TestConsole = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [inputJson, setInputJson] = useState('{\n    "params": {\n        "key": "value"\n    }\n}');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setError('Failed to load templates.');
        }
    };

    const handleTemplateChange = (e) => {
        const tplId = e.target.value;
        setSelectedTemplateId(tplId);
        setResult(null);
        setError('');

        // Try to pre-fill helpful JSON based on template type
        const tpl = templates.find(t => t.id === parseInt(tplId));
        if (tpl) {
            // Check source_details because 'source' is just the ID
            if (tpl.source_details && tpl.source_details.api_url) {
                // Active Fetch
                // Extract param from URL specific to the API (e.g. {cnpj}, {id})
                const match = tpl.source_details.api_url.match(/\{([^}]+)\}/);
                const paramKey = match ? match[1] : 'id';
                setInputJson(`{\n    "params": {\n        "${paramKey}": "value"\n    }\n}`);
            } else {
                // Passive / Webhook
                setInputJson('{\n    "params": {\n        "key": "value"\n    }\n}');
            }
        }
    };

    const handleExecute = async () => {
        setLoading(true);
        setResult(null);
        setError('');
        try {
            let parsedInput;
            try {
                console.log("Raw Input JSON:", inputJson); // DEBUG
                parsedInput = JSON.parse(inputJson);
                // Force is_test flag
                parsedInput.is_test = true;
            } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("Invalid JSON format");
            }

            const response = await api.post(`/templates/${selectedTemplateId}/execute/`, parsedInput);
            setResult(response.data);
        } catch (err) {
            console.error("Execution error:", err);
            setError(err.response?.data?.error || err.message || "Execution Failed");
            if (err.response?.data) {
                setResult(err.response.data); // Show error detail if available
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Test Console 🧪</h1>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">

                {/* 1. Template Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                    <select
                        value={selectedTemplateId}
                        onChange={handleTemplateChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Choose a Template --</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.id} - {t.name} ({t.source?.name} ➔ {t.target?.name})</option>
                        ))}
                    </select>
                </div>

                {/* 2. Input Editor */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input JSON
                        <span className="text-xs text-gray-500 font-normal ml-2">
                            (Use "params" for Active Fetch, or raw JSON for Webhooks)
                        </span>
                    </label>
                    <textarea
                        value={inputJson}
                        onChange={(e) => setInputJson(e.target.value)}
                        className="w-full h-48 font-mono text-sm p-3 bg-slate-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        spellCheck="false"
                    />
                </div>

                {/* 3. Action Button */}
                <button
                    onClick={handleExecute}
                    disabled={!selectedTemplateId || loading}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Execute Integration
                </button>
            </div>

            {/* 4. Results Display */}
            {(result || error) && (
                <div className={`p-6 rounded-lg shadow-md border ${error && !result?.Id ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        {error && !result?.Id ? <AlertCircle className="text-red-600 w-5 h-5" /> : <CheckCircle className="text-green-600 w-5 h-5" />}
                        Execution Result
                    </h3>

                    {error && (
                        <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {result && (
                        <div className="bg-slate-900 rounded-md overflow-hidden">
                            <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
                                <span className="text-xs text-slate-400 font-mono">OUTPUT JSON</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Copy
                                </button>
                            </div>
                            <pre className="p-4 text-sm font-mono text-green-400 overflow-auto max-h-96">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TestConsole;
