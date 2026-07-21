import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactPhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { UserContext } from "./UserContext";
import AuthService from "../../services/auth.service";
import Swal from 'sweetalert2';
import { InlineIcon } from '@iconify/react';

const Registration = () => {
  const navigate = useNavigate();
  const [state, setState] = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const storedRole = (window.localStorage.getItem('role') || '').replace(/"/g, '');
  const [role, setRole] = useState(storedRole || 'patient');

  const { user, errors } = state;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === "confirmPassword" && value !== user.password) {
      newErrors[name] = "Passwords do not match";
    } else {
      delete newErrors[name];
    }
    if (name === "password") {
      if (value !== user.confirmPassword && user.confirmPassword) {
        newErrors["confirmPassword"] = "Passwords do not match";
      } else {
        delete newErrors["confirmPassword"];
      }
    }

    setState({ ...state, user: { ...state.user, [name]: value }, errors: newErrors });
  };

  const handlePhone = (value) => {
    setState({ ...state, user: { ...state.user, phone: value } });
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    window.localStorage.setItem('role', r);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, phone, password, confirmPassword } = user;

    if (password !== confirmPassword) {
      Swal.fire({ title: 'Error', text: 'Passwords do not match.', icon: 'error' });
      return;
    }
    if (!phone || phone.length < 7) {
      Swal.fire({ title: 'Invalid Phone', text: 'Please enter a valid mobile number.', icon: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(username, "", password, "", "", "", phone, role);
      Swal.fire({ title: 'Registration Successful!', text: 'Your account has been created. You can now sign in.', icon: 'success' })
        .then(() => navigate("/login"));
    } catch (error) {
      Swal.fire({ title: 'Error', text: error?.response?.data?.message || 'Registration failed. Please try again.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen">
      <Navbar />

      <div className="relative pt-32 pb-20 overflow-hidden mesh-gradient flex items-center">
        <div className="absolute top-6 left-[20%] w-72 h-72 rounded-full bg-sky-500/10 blur-[80px] animate-float-slow" />
        <div className="absolute bottom-0 right-[15%] w-64 h-64 rounded-full bg-indigo-500/10 blur-[90px] animate-float-slow-reverse" />
        <div className="relative section-shell z-10 text-center">
          <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest font-bold">Get Started</p>
          <h1 className="text-white text-4xl md:text-5xl font-bold">
            Create Your <span className="text-gradient">Account</span>
          </h1>
        </div>
      </div>

      <section className="py-20 bg-slate-50">
        <div className="section-shell">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] border border-slate-100">

              {/* Role Selector */}
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">I am a</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('patient')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all ${
                      role === 'patient'
                        ? 'bg-sky-500 border-sky-500 text-white shadow-[0_8px_20px_-5px_rgba(14,165,233,0.4)]'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-500'
                    }`}
                  >
                    <InlineIcon icon="mdi:account-heart" width={20} />
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('doctor')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all ${
                      role === 'doctor'
                        ? 'bg-sky-500 border-sky-500 text-white shadow-[0_8px_20px_-5px_rgba(14,165,233,0.4)]'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-500'
                    }`}
                  >
                    <InlineIcon icon="mdi:doctor" width={20} />
                    Doctor
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Username</label>
                  <input
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    required
                    minLength={3}
                    maxLength={30}
                    placeholder="e.g. johndoe123"
                    className={`w-full bg-slate-50 border ${errors["username"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
                  />
                  {errors["username"] && <p className="text-xs text-red-500 font-bold mt-1 pl-1">Username must be at least 3 characters</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Mobile Number</label>
                  <ReactPhoneInput
                    specialLabel=""
                    country="tn"
                    value={user.phone}
                    onChange={handlePhone}
                    inputClass="!w-full !bg-slate-50 !border !border-slate-200 !rounded-2xl !px-14 !py-7 !text-slate-800 !outline-none focus:!ring-2 focus:!ring-sky-400 focus:!border-sky-400 !transition-all !h-auto"
                    buttonClass="!bg-transparent !border-none !rounded-2xl !left-2 !top-1/2 !-translate-y-1/2"
                    placeholder="e.g. 55 123 456"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={user.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      className={`w-full bg-slate-50 border ${errors["password"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors">
                      <InlineIcon icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} />
                    </button>
                  </div>
                  {errors["password"] && <p className="text-xs text-red-500 font-bold mt-1 pl-1">Password must be at least 8 characters</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showCPassword ? 'text' : 'password'}
                      value={user.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-type password"
                      className={`w-full bg-slate-50 border ${errors["confirmPassword"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
                    />
                    <button type="button" onClick={() => setShowCPassword(!showCPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors">
                      <InlineIcon icon={showCPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} />
                    </button>
                  </div>
                  {errors["confirmPassword"] && <p className="text-xs text-red-500 font-bold mt-1 pl-1">Passwords do not match</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-black py-4 rounded-2xl shadow-[0_15px_30px_-5px_rgba(14,165,233,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create Account
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-sky-500 font-bold hover:underline no-underline">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Registration;
