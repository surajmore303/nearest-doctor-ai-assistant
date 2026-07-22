import React, { useState, useEffect } from "react";
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
      setMessage("Username / Mobile number and password are required.");
      return;
    }
    setMessage("");
    setLoading(true);

    const cleanInput = username.trim().toLowerCase();

    // 1. Patient Login Credential Match (suraj / suraj more / 12345678)
    if ((cleanInput.includes("suraj") || cleanInput.includes("patient") || cleanInput === "12345678") && password === "12345678") {
      const patientData = {
        id: "pat_suraj",
        username: "Suraj Manik More",
        firstname: "Suraj",
        lastname: "More",
        email: "lucky.78548more@gmail.com",
        role: "patient",
        roles: ["ROLE_PATIENT"]
      };
      localStorage.setItem("user_patient", JSON.stringify(patientData));
      localStorage.setItem("user", JSON.stringify(patientData));
      localStorage.setItem("role", "patient");
      setLoading(false);
      navigate("/patient/app", { replace: true });
      return;
    }

    // 2. Doctor Login Credential Match (manik / manik more / 123456789)
    if ((cleanInput.includes("manik") || cleanInput.includes("doctor") || cleanInput === "123456789") && password === "123456789") {
      const doctorData = {
        id: "doc_manik",
        username: "Dr. Manik More",
        firstname: "Manik",
        lastname: "More",
        email: "manikmore@nearestdoctor.com",
        speciality: "General Physician & Cardiology",
        role: "doctor",
        roles: ["ROLE_DOCTOR"]
      };
      localStorage.setItem("user_doctor", JSON.stringify(doctorData));
      localStorage.setItem("user", JSON.stringify(doctorData));
      localStorage.setItem("role", "doctor");
      setLoading(false);
      navigate("/doctor/app", { replace: true });
      return;
    }

    // 3. Fallback to Backend Authentication
    AuthService.login(username, password)
      .then((data) => {
        const role = (data.role || localStorage.getItem('role') || '').replace(/"/g, '');
        if (role === 'doctor') navigate("/doctor/app", { replace: true });
        else if (role === 'patient') navigate("/patient/app", { replace: true });
        else if (role === 'admin') navigate("/admin/app", { replace: true });
      })
      .catch((error) => {
        setLoading(false);
        setMessage(error.response?.data?.message || error.message || "Invalid login credentials. Please check your username/password.");
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
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <h2 className="text-slate-900 text-2xl font-black mb-1 text-center">Sign In</h2>
          <p className="text-slate-500 text-sm font-medium text-center mb-8">Access your NearestDoctor healthcare portal</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-xs font-black uppercase tracking-wider mb-2 ml-1">Username / Mobile Number</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username or mobile number"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-black uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all font-medium text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors">
                  <InlineIcon icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} />
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot" className="text-sky-500 hover:text-sky-600 text-xs font-bold no-underline">
                Forgot password?
              </Link>
            </div>

            {message && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl px-4 py-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-black uppercase tracking-wider text-xs py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sign In to Account
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-8 pt-6 border-t border-slate-100 font-medium">
            Don't have an account?{" "}
            <Link to="/role" className="text-sky-500 font-bold no-underline hover:underline">Register Now</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
