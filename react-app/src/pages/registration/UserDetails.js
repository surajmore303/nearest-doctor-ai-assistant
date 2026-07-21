import React, { useContext, useState } from "react";
import ReactPhoneInput from "react-phone-input-2";
import { UserContext } from "./UserContext";
import "react-phone-input-2/lib/style.css";
import Iconify from '../../components/common/Iconify';

const UserDetails = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [state] = useContext(UserContext);
  const { user, errors } = state;

  return (
    <div className="space-y-6">
      {/* Username */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Username</label>
        <input
          name="username"
          value={user.username}
          onChange={props.onChange}
          required
          minLength={3}
          maxLength={30}
          placeholder="e.g. johndoe123"
          className={`w-full bg-slate-50 border ${errors["username"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
        />
        {errors["username"] && <p className="text-xs text-red-500 font-bold pl-1">Username must be at least 3 characters</p>}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Mobile Number</label>
        <ReactPhoneInput
          specialLabel={""}
          country={"tn"}
          name="phone"
          value={user.phone}
          onChange={(value) => props.onChange({ target: { name: 'phone', value } })}
          inputClass="!w-full !bg-slate-50 !border !border-slate-200 !rounded-2xl !px-14 !py-7 !text-slate-800 !outline-none focus:!ring-2 focus:!ring-sky-400 focus:!border-sky-400 !transition-all !h-auto"
          buttonClass="!bg-transparent !border-none !rounded-2xl !left-2 !top-1/2 !-translate-y-1/2"
          placeholder="e.g. 55 123 456"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={user.password}
              onChange={props.onChange}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className={`w-full bg-slate-50 border ${errors["password"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500 transition-colors">
              <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
            </button>
          </div>
          {errors["password"] && <p className="text-xs text-red-500 font-bold pl-1">Password must be at least 8 characters</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
          <div className="relative">
            <input
              name="confirmPassword"
              type={showCPassword ? 'text' : 'password'}
              value={user.confirmPassword}
              onChange={props.onChange}
              required
              placeholder="Re-type password"
              className={`w-full bg-slate-50 border ${errors["confirmPassword"] ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-6 py-4 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all`}
            />
            <button type="button" onClick={() => setShowCPassword(!showCPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500 transition-colors">
              <Iconify icon={showCPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
            </button>
          </div>
          {errors["confirmPassword"] && <p className="text-xs text-red-500 font-bold pl-1">Passwords do not match</p>}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
