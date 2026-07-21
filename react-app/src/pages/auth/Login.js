import React, { useState, useRef, useEffect } from "react";
import AuthService from "../../services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../../api-config";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { InlineIcon } from '@iconify/react';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // LinkedIn OAuth
  const handleLinkedIn = () => {
    const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID || "78zj0z0qx941dq";
    const redirectUri = process.env.REACT_APP_LINKEDIN_REDIRECT_URI || `${API_BASE_URL}/oauth`;
    const authUrl = process.env.REACT_APP_LINKEDIN_AUTH_URL || "https://www.linkedin.com/oauth/v2/authorization";
    const oauthUrl = `${authUrl}?response_type=code&client_id=${clientId}&scope=r_liteprofile%20r_emailaddress&state=123456&redirect_uri=${redirectUri}`;
    const w = 700, h = 730;
    window.open(oauthUrl, "Linkedin", `menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=${w},height=${h},top=${window.screen.height / 2 - h / 2},left=${window.screen.width / 2 - w / 2}`);
  };

  const handlePostMessage = React.useCallback((event) => {
    if (event.data.type === "profile") {
      AuthService.loginlinkedin(event.data.profile.elements[0]["handle~"].emailAddress)
        .then(() => {
          const role = localStorage.getItem('role') || '';
          if (role.match('doctor')) navigate("/doctor/app", { replace: true });
          else if (role.match('patient')) navigate("/patient/app", { replace: true });
        })
        .catch(() => Swal.fire({ title: 'Not a registered user', text: 'Try Again', icon: 'warning' }));
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, [handlePostMessage]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setMessage("Username and password are required.");
      return;
    }
    setMessage("");
    setLoading(true);
    AuthService.login(username, password).then((data) => {
      const role = (data.role || localStorage.getItem('role') || '').replace(/"/g, '');
      if (role === 'doctor') navigate("/doctor/app", { replace: true });
      else if (role === 'patient') navigate("/patient/app", { replace: true });
      else if (role === 'admin') navigate("/admin/app", { replace: true });
    }).catch((error) => {
      setLoading(false);
      setMessage((error.response?.data?.message) || error.message || "Login failed.");
    });
  };

  return (
    <div className="bg-slate-950 min-h-screen">
      <Navbar />

      <div className="relative pt-32 pb-20 overflow-hidden mesh-gradient flex items-center">
        <div className="absolute top-6 left-[20%] w-72 h-72 rounded-full bg-sky-500/10 blur-[80px] animate-float-slow" />
        <div className="absolute bottom-0 right-[10%] w-56 h-56 rounded-full bg-indigo-500/10 blur-[60px] animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="relative section-shell z-10">
          <p className="text-slate-400 text-sm mb-2">
            <Link to="/" className="text-sky-400 no-underline hover:text-sky-300 transition-colors">Home</Link>
            <span className="mx-2 text-slate-600">›</span>
            <span>Sign In</span>
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-bold">
            Welcome <span className="text-gradient">Back</span>
          </h1>
        </div>
      </div>

      <div className="min-h-[60vh] bg-slate-50 flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-slate-800 text-2xl font-bold mb-1 text-center">Sign In</h2>
          <p className="text-slate-500 text-sm text-center mb-6">Access your NearestDoctor account</p>



          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Mobile Number</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your mobile number"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors">
                  <InlineIcon icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} />
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot" className="text-sky-500 hover:text-sky-600 text-sm font-medium no-underline">
                Forgot password?
              </Link>
            </div>

            {message && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Demo Access */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <p className="text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('user', JSON.stringify({ id: 'demo-doc', username: 'DemoDoctor', roles: ['ROLE_DOCTOR'] }));
                  localStorage.setItem('role', 'doctor');
                  navigate("/doctor/app");
                }}
                className="bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <InlineIcon icon="mdi:doctor" width={16} />
                Demo Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('user', JSON.stringify({ id: 'demo-pat', username: 'DemoPatient', roles: ['ROLE_PATIENT'] }));
                  localStorage.setItem('role', 'patient');
                  navigate("/patient/app");
                }}
                className="bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <InlineIcon icon="mdi:account" width={16} />
                Demo Patient
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/role" className="text-sky-500 font-semibold no-underline hover:underline">Register Now</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
