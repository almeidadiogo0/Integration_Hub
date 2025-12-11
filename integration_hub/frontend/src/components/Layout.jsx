import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Network, Activity, Home, List, PlayCircle } from 'lucide-react';

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Network className="text-blue-500" />
                        IntegrationHub
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <NavLink to="/" icon={<Home size={20} />} label="Dashboard" />
                    <NavLink to="/mappings" icon={<List size={20} />} label="My Mappings" />
                    <NavLink to="/test" icon={<PlayCircle size={20} />} label="Test Console" />
                    <NavLink to="/logs" icon={<Activity size={20} />} label="Execution Logs" />
                </nav>
                <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
                    v1.0.0 Manual Mode
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

const NavLink = ({ to, icon, label }) => (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
        {icon}
        <span className="font-medium">{label}</span>
    </Link>
);

export default Layout;
