import React, { useState, useEffect } from 'react';
import { IntegrationService } from '../services/api';
import { ArrowRight, Save, Play } from 'lucide-react';
import Step1Config from './Step1Config';
import Step2Mapping from './Step2Mapping';
import { useNavigate, useParams } from 'react-router-dom';

const MappingWizard = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Wizard State
    const [templateData, setTemplateData] = useState({
        name: '',
        description: '',
        source_id: '',
        target_id: '',
        active_version_number: 0 // Store current max version
    });

    const [mappingRules, setMappingRules] = useState([
        { id: 1, source_path: '$.data.cnpj', target_field: 'cnpj', transform: 'REMOVE_PUNCTUATION' }
    ]);

    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        IntegrationService.getProfiles().then(res => setProfiles(res.data));
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            IntegrationService.getTemplate(id).then(res => {
                const t = res.data;
                setTemplateData({
                    name: t.name,
                    description: t.description,
                    source_id: t.source,
                    target_id: t.target,
                    active_version_number: t.active_version_details?.version_number || 0
                });
                if (t.active_version_details?.rules) {
                    setMappingRules(t.active_version_details.rules);
                }
            }).finally(() => setLoading(false));
        }
    }, [isEditMode, id]);

    const selectedSource = profiles.find(p => p.id == templateData.source_id);
    const selectedTarget = profiles.find(p => p.id == templateData.target_id);

    const handleNext = () => {
        if (step === 1 && templateData.name && templateData.source_id && templateData.target_id) {
            setStep(2);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Create OR Update Template
            let templateId = id;
            if (isEditMode) {
                await IntegrationService.updateTemplate(id, {
                    name: templateData.name,
                    description: templateData.description
                });
            } else {
                const tplRes = await IntegrationService.createTemplate({
                    name: templateData.name,
                    description: templateData.description,
                    source: templateData.source_id,
                    target: templateData.target_id
                });
                templateId = tplRes.data.id;
            }

            // 2. Determine Version Number
            const nextVersion = (templateData.active_version_number || 0) + 1;

            const verRes = await IntegrationService.createVersion({
                template: templateId,
                version_number: nextVersion,
                rules: mappingRules
            });

            // 3. Update Template with active version
            await IntegrationService.updateTemplate(templateId, { active_version: verRes.data.id });

            alert('Template Saved Successfully!');
            navigate('/mappings');
        } catch (error) {
            console.error(error);
            alert('Error saving template: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Mapping Template' : 'Create Mapping Template'}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={step === 1 ? "font-bold text-blue-600" : ""}>1. Configuration</span>
                    <ArrowRight size={16} />
                    <span className={step === 2 ? "font-bold text-blue-600" : ""}>2. Mapping Rules</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                <div className="p-8 flex-1">
                    {step === 1 && (
                        <Step1Config
                            data={templateData}
                            onChange={setTemplateData}
                            profiles={profiles}
                        />
                    )}
                    {step === 2 && (
                        <Step2Mapping
                            rules={mappingRules}
                            onChange={setMappingRules}
                            sourceSchema={selectedSource?.schema}
                            targetSchema={selectedTarget?.schema}
                        />
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800">
                            Back
                        </button>
                    )}

                    {step === 1 ? (
                        <button onClick={handleNext} disabled={!templateData.name || !templateData.source_id} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            Next Step <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50">
                            <Save size={18} /> Save & Activate
                        </button>
                    )}
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-600 font-medium animate-pulse">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MappingWizard;
