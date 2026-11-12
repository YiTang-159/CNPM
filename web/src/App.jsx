import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Demo from './pages/Demo.jsx';
import Pricing from './pages/Pricing.jsx';
import About from './pages/About.jsx';
import Faq from './pages/Faq.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { Terms, Privacy } from './pages/Legal.jsx';
import Admin from './pages/Admin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminQr from './pages/AdminQr.jsx';
import Guest from './pages/Guest.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminVideos from './pages/AdminVideo.jsx';
import AdminLanguages from './pages/AdminLanguages.jsx';
import AdminMediaResults from './pages/AdminMediaResults.jsx';
import AdminFeedback from './pages/AdminFeedback.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminQueue from './pages/AdminQueue.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="demo" element={<Demo />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<Faq />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="account" element={<Account />} />
        <Route path="guest" element={<Guest />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Admin />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="queue" element={<AdminQueue />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="videos" element={<AdminVideos />} />
        <Route path="languages" element={<AdminLanguages />} />
        <Route path="narrations" element={<AdminMediaResults kind="narrations" />} />
        <Route path="subtitles" element={<AdminMediaResults kind="subtitles" />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="qr" element={<AdminQr />} />
      </Route>
    </Routes>
  );
}
