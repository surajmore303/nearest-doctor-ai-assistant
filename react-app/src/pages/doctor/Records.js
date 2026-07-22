import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MOCK_PATIENTS } from "../../constants/mockRecords";
import Iconify from '../../components/common/Iconify';
import API_BASE_URL from "../../api-config";

const API_BASE = API_BASE_URL;

function Records() {
  const [users, setUsers] = useState([]);
  const [searchvalue, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dossiers');
  const [uploadedRecords, setUploadedRecords] = useState([]);

  const fetchRecordsAndPatients = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch Patients
      const userRes = await axios(`${API_BASE}/users/users-patients/patient`);
      if (userRes.data && userRes.data.length > 0) {
        setUsers(userRes.data);
      } else {
        setUsers(MOCK_PATIENTS);
      }

      // 2. Fetch Uploaded Medical Records from MongoDB
      const recRes = await axios(`${API_BASE}/records`);
      let allRecords = [];
      if (recRes.data && recRes.data.length > 0) {
        recRes.data.forEach(r => {
          if (r.notes && Array.isArray(r.notes)) {
            allRecords = [...allRecords, ...r.notes];
          }
        });
      }

      // Check localStorage for patient-uploaded records across tabs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('patient_records_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            allRecords = [...allRecords, ...parsed];
          } catch (e) {}
        }
      }

      // Unique records filter
      const uniqueRecords = allRecords.filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.diseaseTitle === v.diseaseTitle && t.pastDoctor === v.pastDoctor)) === i);
      setUploadedRecords(uniqueRecords);
    } catch (err) {
      console.error("Failed to fetch patients/records:", err);
      setUsers(MOCK_PATIENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordsAndPatients();
  }, [fetchRecordsAndPatients]);

  const filteredUsers = users?.filter(
    (user) =>
      user.firstname?.toLowerCase().includes(searchvalue.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchvalue.toLowerCase())
  ) || [];

  const filteredUploaded = uploadedRecords?.filter(
    (rec) =>
      rec.diseaseTitle?.toLowerCase().includes(searchvalue.toLowerCase()) ||
      rec.pastDoctor?.toLowerCase().includes(searchvalue.toLowerCase()) ||
      rec.patientName?.toLowerCase().includes(searchvalue.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-6 pb-2">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Medical <span className="text-sky-500">Records</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Access patient uploaded medical histories and past doctor consultations.</p>
        </div>

        {/* Search Bar */}
        <div className="relative hidden sm:block w-72 lg:w-96 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Iconify icon="solar:magnifer-bold-duotone" width={20} className="text-slate-400 group-focus-within:text-sky-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search disease, doctor, or patient..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-3 p-1.5 bg-slate-100/60 rounded-[1.8rem] w-fit">
        <button
          onClick={() => setActiveTab('dossiers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${
            activeTab === 'dossiers'
              ? 'bg-white text-sky-600 shadow-md ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Iconify icon="solar:users-group-two-rounded-bold-duotone" width={18} />
          Patient Dossiers
        </button>
        <button
          onClick={() => setActiveTab('uploaded')}
          className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${
            activeTab === 'uploaded'
              ? 'bg-white text-sky-600 shadow-md ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Iconify icon="solar:document-medicine-bold-duotone" width={18} />
          Patient Uploaded Records ({uploadedRecords.length})
        </button>
      </div>

      {activeTab === 'dossiers' ? (
        /* Main Patient Dossiers Table */
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Name</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Birthday</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((object, index) => (
                    <tr key={index} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-sm uppercase">
                            {object.firstname?.[0]}{object.lastname?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-tight transition-colors group-hover:text-sky-600">
                              {object.firstname} {object.lastname}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">ID: {object._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Iconify icon="solar:phone-bold-duotone" width={14} className="text-slate-300" />
                            <span className="text-sm font-bold">{object.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Iconify icon="solar:letter-bold-duotone" width={14} className="text-slate-300" />
                            <span className="text-xs font-medium">{object.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs">
                          <Iconify icon="solar:calendar-bold-duotone" width={14} className="text-slate-400" />
                          {object.birthdate || 'Not set'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/doctor/record/medicalrecord/${object._id}`}
                            className="px-6 py-2.5 rounded-[1.25rem] bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 group/btn no-underline"
                          >
                            <Iconify icon="solar:notebook-bold-duotone" width={16} className="text-slate-400 group-hover/btn:text-white transition-colors" />
                            View Dossier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="max-w-xs mx-auto space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                          <Iconify icon="solar:folder-error-bold-duotone" width={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">No Records Found</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">We couldn't find any medical records matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Patient Uploaded Medical Records & Past Consultations View */
        <div className="space-y-6">
          {filteredUploaded.length > 0 ? (
            filteredUploaded.map((rec) => (
              <div key={rec.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                  <Iconify icon="solar:file-corrupted-bold-duotone" width={32} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">{rec.diseaseTitle}</h3>
                    <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-[10px] font-black uppercase tracking-widest">
                      {rec.category || 'Medical Record'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                      Patient: {rec.patientName || 'Patient'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past Consultant Doctor</p>
                      <p className="font-bold text-slate-800">{rec.pastDoctor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultation Date</p>
                      <p className="font-bold text-slate-800">{rec.recordDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attachment Reference</p>
                      <p className="font-bold text-sky-600 flex items-center gap-1">
                        <Iconify icon="solar:paperclip-bold-duotone" width={16} />
                        {rec.attachmentName || 'Document.pdf'}
                      </p>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                      <strong>Diagnosis & Prescribed Notes:</strong> {rec.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 p-20 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 bg-sky-50 rounded-[2rem] flex items-center justify-center mx-auto">
                  <Iconify icon="solar:document-add-bold-duotone" width={40} className="text-sky-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No Patient Uploaded Records</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  When patients upload their disease details, past consultant doctors, and prescriptions from their panel, they will appear right here for your clinical review.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Records;
