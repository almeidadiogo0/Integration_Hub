import React, { useEffect, useState } from 'react';
import { IntegrationService } from '../services/api';
import { CheckCircle, XCircle, Layout, Activity, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalTemplates: 0,
        totalExecutions: 0,
        recentLogs: []
    });

    useEffect(() => {
        Promise.all([
            IntegrationService.getTemplates(),
            IntegrationService.getLogs()
        ]).then(([tplRes, logsRes]) => {
            setStats({
                totalTemplates: tplRes.data.length,
                totalExecutions: logsRes.data.length,
                recentLogs: logsRes.data.slice(0, 5) // Last 5
            });
        });
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-800">Integration Dashboard</h2>
                <p className="text-slate-500 mt-1">Overview of system health and activity</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Layout size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.totalTemplates}</div>
                        <div className="text-sm text-slate-500">Active Mappings</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.totalExecutions}</div>
                        <div className="text-sm text-slate-500">Total Executions</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">99.9%</div>
                        <div className="text-sm text-slate-500">Uptime (Mock)</div>
                    </div>
                </div>
            </div>

            {/* Recent Logs (Already had this, just simplified) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Executions</h3>
                    <Link to="/logs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
                </div>
                <div className="space-y-3">
                    {stats.recentLogs.length === 0 ? <p className="text-slate-400">No executions recorded.</p> : stats.recentLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                {log.status === 'SUCCESS' ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />}
                                <div>
                                    <div className="font-medium text-slate-700">{log.template_name || 'Unknown Template'}</div>
                                    <div className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                            {log.status === 'ERROR' && (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-[150px] truncate" title={log.error_message}>
                                    {log.error_message}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
