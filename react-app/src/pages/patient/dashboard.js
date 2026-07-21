import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { GetAppointments } from "../../store/actions/appointment";
import AuthService from "../../services/auth.service";
import dayjs from "dayjs";
import axios from "axios";
import API_BASE_URL from "../../api-config";
import Iconify from '../../components/common/Iconify';

const MOCK_APPOINTMENTS = [
    { _id: 'm1', DoctorName: 'Sarah Johnson', StartDate: dayjs().add(2, 'day').toISOString(), status: 'Confirmed', type: 'Consultation' },
    { _id: 'm2', DoctorName: 'Michael Chen', StartDate: dayjs().add(5, 'day').toISOString(), status: 'Pending', type: 'Follow-up' },
    { _id: 'm3', DoctorName: 'Emily White', StartDate: dayjs().subtract(3, 'day').toISOString(), status: 'Completed', type: 'General Checkup' },
    { _id: 'm4', DoctorName: 'Robert Brown', StartDate: dayjs().add(1, 'week').toISOString(), status: 'Confirmed', type: 'Specialist' },
    { _id: 'm5', DoctorName: 'Jessica Lee', StartDate: dayjs().add(3, 'hour').toISOString(), status: 'Confirmed', type: 'Urgent' },
];

function MessageModal({ doctor, currentUser, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API_BASE_URL}/messages/send`, {
        senderId: currentUser.id,
        senderName: currentUser.username,
        doctorId: doctor._id,
        subject: subject || 'General Inquiry',
        body
      });
      setSent(true);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 transition-all">
          <Iconify icon="eva:close-fill" className="w-6 h-6 text-slate-400" />
        </button>
        {sent ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <Iconify icon="eva:checkmark-circle-2-fill" className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Message Sent!</h3>
            <p className="text-slate-500">Dr. {doctor.firstname} {doctor.lastname} will receive your message.</p>
            <button onClick={onClose} className="mt-8 px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 font-black text-xl">
                {doctor.firstname?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Message Dr. {doctor.firstname} {doctor.lastname}</h3>
                <p className="text-xs text-sky-500 font-bold uppercase tracking-widest">{doctor.speciality || 'Medical Professional'}</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Subject (optional)"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-sm font-medium"
            />
            <textarea
              placeholder="Write your message or report here..."
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 mb-6 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-sm font-medium resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-sm hover:bg-sky-600 transition-all disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const currentUser = AuthService.getCurrentUser();
  const dispatch = useDispatch();
  const liveAppointments = useSelector((state) => state.appointmentReducer.appointment);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const appointments = liveAppointments && liveAppointments.length > 0 ? liveAppointments : MOCK_APPOINTMENTS;

  useEffect(() => {
    if (currentUser?.id) dispatch(GetAppointments(currentUser.id));
    axios.get(`${API_BASE_URL}/users/doctors`)
      .then(res => setDoctors(res.data.slice(0, 4)))
      .catch(() => {});
  }, [dispatch, currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest">Initializing Session...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
        {selectedDoctor && <MessageModal doctor={selectedDoctor} currentUser={currentUser} onClose={() => setSelectedDoctor(null)} />}
        {/* Header Section */}
        <div className="flex flex-row items-center justify-between gap-6 pb-2">
          <div className="text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="text-sky-500">{currentUser.username}</span>!
            </h1>
            <p className="text-slate-500 font-medium mt-1">Here is what's happening with your medical profile today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Iconify icon="eva:settings-2-fill" className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 whitespace-nowrap">
              <Iconify icon="eva:plus-fill" className="w-5 h-5" />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden text-xs">New</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Appointments', value: appointments?.length || '0', icon: 'eva:calendar-fill', color: 'sky' },
            { label: 'Active Treatments', value: '2', icon: 'eva:activity-fill', color: 'emerald' },
            { label: 'Pending Results', value: '1', icon: 'eva:file-text-fill', color: 'amber' },
          ].map((stat) => (
            <div key={stat.label} className="p-8 rounded-[2rem] bg-white border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-sky-50 transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                  <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                  <Iconify icon={stat.icon} className="w-7 h-7" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Appointments Table Card */}
        <div className="rounded-[2.5rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center">
                <Iconify icon="eva:list-fill" className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Upcoming Appointments</h2>
            </div>
            <button className="text-sky-500 font-bold hover:underline py-2">Full History</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Professional</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Service</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Timing</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments && appointments.length > 0 ? (
                  appointments.map((app) => (
                    <tr key={app._id} className="hover:bg-sky-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                            {app.DoctorName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">Dr. {app.DoctorName}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">Primary Specialist</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest border border-sky-100">Consultation</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-700">{dayjs(app.StartDate).format("MMM DD, YYYY")}</p>
                        <p className="text-xs text-slate-400 mt-1">{dayjs(app.StartDate).format("hh:mm A")}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40 py-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
                            <Iconify icon="eva:calendar-outline" className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No scheduled appointments</p>
                        <button className="mt-6 px-8 py-3 rounded-2xl bg-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all">
                            Book First Visit
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Available Doctors Section */}
        {doctors.length > 0 && (
          <div className="rounded-[2.5rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <Iconify icon="eva:people-fill" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Available Doctors</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Newly registered — connect instantly</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                {doctors.length} Online
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-slate-50">
              {doctors.map((doc) => (
                <div key={doc._id} className="p-8 flex flex-col items-center text-center gap-4 hover:bg-sky-50/30 transition-all group">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden">
                      <img src={doc.picture || `https://ui-avatars.com/api/?name=${doc.firstname}+${doc.lastname}&background=0ea5e9&color=fff&size=64`} alt={doc.firstname} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 leading-none">Dr. {doc.firstname} {doc.lastname}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mt-1.5">{doc.speciality || 'General'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    className="w-full py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all group-hover:shadow-lg"
                  >
                    <Iconify icon="eva:message-circle-fill" className="w-4 h-4 inline mr-1.5" />
                    Send Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
  );
};

export default Dashboard;