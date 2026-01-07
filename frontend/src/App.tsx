import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ReceiptUpload from './pages/ReceiptUpload';
import VoiceUpload from './pages/VoiceUpload';
import Ledger from './pages/Ledger';
import Advisor from './pages/Advisor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - no layout */}
        <Route path="/" element={<Landing />} />
        
        {/* App pages with layout */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="receipt" element={<ReceiptUpload />} />
          <Route path="voice" element={<VoiceUpload />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="advisor" element={<Advisor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
