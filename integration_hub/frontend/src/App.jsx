import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MappingsList from './components/MappingsList';
import MappingWizard from './components/MappingWizard';
import TestConsole from './components/TestConsole';
const LogsPage = () => <div className="p-8"><h2>Logs Coming Soon</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="mappings" element={<MappingsList />} />
          <Route path="templates/new" element={<MappingWizard />} />
          <Route path="/templates/:id/edit" element={<MappingWizard />} />
          <Route path="/test" element={<TestConsole />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
