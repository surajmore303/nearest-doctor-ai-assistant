import React, { useState, useEffect } from "react";
import Iconify from '../../components/common/Iconify';
import AuthService from "../../services/auth.service";
import axios from "axios";
import API_BASE_URL from "../../api-config";

export default function Profile() {
  const currentUser = AuthService.getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    axios.get(`${API_BASE_URL}/users/user/${currentUser.id}`)
      .then(res => {
        const d = res.data;
        setProfile({
          username:        d.username || "",
          email:           d.email || "",
          firstName:       d.firstname || "",
          lastName:        d.lastname || "",
          phone:           d.phone || "",
          gender:          d.gender || "Male",
          biography:       d.about || "",
          clinicName:      d.cabinet || "",
          clinicAddress:   d.address || "",
          services:        d.services || "",
          specialization:  d.speciality || "",
          picture:         d.picture || "",
        });
      })
      .catch(() => setProfile({ username: currentUser.username, email: "", firstName: "", lastName: "", phone: "", gender: "Male", biography: "", clinicName: "", clinicAddress: "", services: "", specialization: "", picture: "" }));
  }, [currentUser?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/users/update-user/${currentUser.id}`, {
        firstname:  profile.firstName,
        lastname:   profile.lastName,
        phone:      profile.phone,
        gender:     profile.gender,
        about:      profile.biography,
        cabinet:    profile.clinicName,
        address:    profile.clinicAddress,
        services:   profile.services,
        speciality: profile.specialization,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="text-left uppercase">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Account <span className="text-sky-500">Profile</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Changes here reflect instantly on your public patient-facing profile.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Iconify icon={saved ? "eva:checkmark-circle-2-fill" : "eva:save-fill"} className="w-5 h-5" />
          <span className="hidden sm:inline">{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-100/50 p-8 text-center space-y-6">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden ring-4 ring-slate-50 shadow-inner mx-auto bg-slate-100">
                <img
                  src={profile.picture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=0ea5e9&color=fff&size=128`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Dr. {profile.firstName} {profile.lastName}</h3>
              <p className="text-xs font-black uppercase tracking-widest text-sky-500 mt-2">{profile.specialization || 'Medical Professional'}</p>
            </div>
            <div className="pt-6 border-t border-slate-50 space-y-4">
              <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50 text-slate-600">
                <Iconify icon="eva:person-fill" className="text-sky-400 w-5 h-5" />
                <span className="text-sm font-bold">{profile.username}</span>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50 text-slate-600 overflow-hidden">
                <Iconify icon="eva:email-fill" className="text-sky-400 w-5 h-5" />
                <span className="text-sm font-bold truncate">{profile.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-100/50 p-10 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
              <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-500">
                <Iconify icon="eva:info-fill" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">General Information</h2>
                <p className="text-slate-500 font-medium text-xs mt-1">Visible to patients on your public profile.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: "First Name",    key: "firstName" },
                { label: "Last Name",     key: "lastName" },
                { label: "Phone Number",  key: "phone" },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
                  <input
                    type="text"
                    value={profile[key]}
                    onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium appearance-none text-slate-900"
                >
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Biography</label>
              <textarea
                rows={4}
                value={profile.biography}
                onChange={e => setProfile({ ...profile, biography: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium resize-none text-slate-900"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-100/50 p-10 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
              <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-500">
                <Iconify icon="eva:home-fill" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Clinic & Professional</h2>
                <p className="text-slate-500 font-medium text-xs mt-1">Shown in patient-facing doctor detail page.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: "Clinic Name",    key: "clinicName" },
                { label: "Clinic Address", key: "clinicAddress" },
                { label: "Services",       key: "services" },
                { label: "Specialization", key: "specialization" },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
                  <input
                    type="text"
                    value={profile[key]}
                    onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
