import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReceiptUpload from './pages/ReceiptUpload';
import VoiceUpload from './pages/VoiceUpload';
import Ledger from './pages/Ledger';
import Advisor from './pages/Advisor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
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
