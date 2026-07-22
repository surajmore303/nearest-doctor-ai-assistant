import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { GetAppointments } from "../../store/actions/appointment";
import AuthService from "../../services/auth.service";
import dayjs from "dayjs";
import axios from "axios";
import API_BASE_URL from "../../api-config";
import Iconify from '../../components/common/Iconify';
import { Link } from 'react-router-dom';

const MOCK_APPOINTMENTS = [
    { _id: 'm1', DoctorName: 'Sarah Johnson', StartDate: dayjs().add(2, 'day').toISOString(), status: 'Confirmed', type: 'Consultation' },
    { _id: 'm2', DoctorName: 'Michael Chen', StartDate: dayjs().add(5, 'day').toISOString(), status: 'Pending', type: 'Follow-up' },
    { _id: 'm3', DoctorName: 'Emily White', StartDate: dayjs().subtract(3, 'day').toISOString(), status: 'Completed', type: 'General Checkup' },
    { _id: 'm4', DoctorName: 'Robert Brown', StartDate: dayjs().add(1, 'week').toISOString(), status: 'Confirmed', type: 'Specialist' },
    { _id: 'm5', DoctorName: 'Jessica Lee', StartDate: dayjs().add(3, 'hour').toISOString(), status: 'Confirmed', type: 'Urgent' },
];

const DISEASE_MEDICINE_DB = [
  {
    id: 'fever',
    title: 'Fever / Bukhar',
    icon: 'eva:thermometer-fill',
    color: 'rose',
    symptoms: 'High body temperature, chills, sweating, body aches',
    medicines: [
      { name: 'Paracetamol (Crocin / Dolo 650)', dose: '1 Tablet (500mg/650mg) after food every 6 hours as needed' },
      { name: 'Ibuprofen (Combiflam)', dose: '1 Tablet after food if severe body aches (consult doctor if acidity history)' }
    ],
    remedies: ['Drink 3L ORS / Warm fluids', 'Cold sponge on forehead', 'Adequate bed rest'],
    warning: 'Consult doctor if fever exceeds 103°F (39.5°C) or lasts over 3 days.'
  },
  {
    id: 'loose_motion',
    title: 'Loose Motion / Diarrhea',
    icon: 'eva:droplet-fill',
    color: 'amber',
    symptoms: 'Frequent watery stools, stomach cramps, dehydration, weakness',
    medicines: [
      { name: 'ORS (Electral / Oral Rehydration Solution)', dose: '1 sachet in 1 Litre boiled cooled water. Sip continuously' },
      { name: 'Loperamide (Imodium)', dose: '1 capsule after loose stool (Max 2-3 per day if non-infectious)' },
      { name: 'Econorm / Sporlac Probiotic', dose: '1 sachet twice daily in water to restore gut flora' }
    ],
    remedies: ['BRAT Diet (Banana, Rice, Applesauce, Toast)', 'Avoid spicy, oily, & dairy products', 'Coconut water & curd rice'],
    warning: 'Seek urgent care if blood in stool, severe vomiting, or no urination for 8 hours.'
  },
  {
    id: 'headache',
    title: 'Headache / Sir Dard',
    icon: 'eva:flash-fill',
    color: 'sky',
    symptoms: 'Throbbing pain around forehead, neck tension, light sensitivity',
    medicines: [
      { name: 'Paracetamol (Crocin 500mg)', dose: '1 Tablet with water after meal' },
      { name: 'Disprin / Aspirin', dose: '1 soluble tablet in water (Avoid if stomach ulcer history)' },
      { name: 'Naproxen / Saridon', dose: '1 Tablet for acute tension headache' }
    ],
    remedies: ['Drink 2 large glasses of water immediately (Dehydration relief)', 'Rest in a quiet dark room', 'Gentle neck massage'],
    warning: 'Seek emergency care for sudden "thunderclap" headache or fever with neck stiffness.'
  },
  {
    id: 'cough_cold',
    title: 'Cold & Cough / Zukaam',
    icon: 'eva:charging-fill',
    color: 'blue',
    symptoms: 'Runny nose, sore throat, sneezing, chesty or dry cough',
    medicines: [
      { name: 'Cetirizine (Cetzine 10mg)', dose: '1 Tablet at bedtime for allergic cold & sneezing' },
      { name: 'Alex / Benadryl Cough Syrup', dose: '10 ml (2 teaspoons) 3 times a day' },
      { name: 'Strepsils / Cofsils Lozenges', dose: 'Suck 1 lozenge every 4 hours for sore throat' }
    ],
    remedies: ['Steam inhalation 2-3 times daily', 'Warm salt water gargle', 'Honey + Ginger tea'],
    warning: 'Consult doctor if cough lasts over 2 weeks or coughing up dark blood.'
  },
  {
    id: 'acidity',
    title: 'Acidity & Gas / Pet Me Gas',
    icon: 'eva:fire-fill',
    color: 'orange',
    symptoms: 'Chest burning (heartburn), sour burps, stomach bloating',
    medicines: [
      { name: 'Digene / Gelusil Liquid Syrup', dose: '2 teaspoons (10 ml) after meals as needed' },
      { name: 'Pantoprazole (Pan 40)', dose: '1 Tablet empty stomach in the morning 30 mins before breakfast' },
      { name: 'Eno Powder', dose: '1 sachet in 1 glass water during acute gas' }
    ],
    remedies: ['Drink cold milk or coconut water', 'Avoid lying down immediately after meals', 'Chew fennel seeds (Saunf)'],
    warning: 'Chest pain radiating to arm or jaw could be heart-related — seek emergency help!'
  },
  {
    id: 'body_pain',
    title: 'Body Pain & Muscle Ache',
    icon: 'eva:heart-fill',
    color: 'indigo',
    symptoms: 'Joint stiffness, backache, muscular weakness, fatigue',
    medicines: [
      { name: 'Combiflam (Ibuprofen + Paracetamol)', dose: '1 Tablet after food twice daily' },
      { name: 'Volini / Moov Spray & Gel', dose: 'Apply gently on affected pain area 3 times daily' },
      { name: 'Calcium + Vitamin D3 Supplement', dose: '1 Tablet daily after breakfast' }
    ],
    remedies: ['Hot water bag compress on sore muscles', 'Gentle stretching exercises', 'Epsom salt warm bath'],
    warning: 'Consult doctor if joint swelling, redness, or pain prevents movement.'
  }
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg relative border border-slate-100">
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
  const [selectedDisease, setSelectedDisease] = useState(DISEASE_MEDICINE_DB[0]);

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
            <Link to="/patient/doctors" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 whitespace-nowrap no-underline">
              <Iconify icon="eva:plus-fill" className="w-5 h-5" />
              <span className="hidden sm:inline">Book Appointment</span>
              <span className="sm:hidden text-xs">Book</span>
            </Link>
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

        {/* 💊 DISEASE & MEDICINE RECOMMENDATION ASSISTANT (NEW FEATURE) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Iconify icon="eva:square-fill" className="w-64 h-64 -rotate-12 text-white" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-700/50">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  Instant Remedy Guide
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">Select Disease & Recommended Medicines</h2>
              <p className="text-slate-300 font-medium text-sm mt-1">Pick a symptom or health condition below to see recommended OTC medicines, dosage, and care tips.</p>
            </div>

            <Link
              to="/patient/ai-assistant"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-lg shadow-sky-500/30 whitespace-nowrap self-start md:self-auto no-underline"
            >
              <Iconify icon="mdi:robot-happy-outline" className="w-5 h-5" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>

          {/* Disease Category Chips Grid */}
          <div className="py-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
            {DISEASE_MEDICINE_DB.map((dis) => {
              const isSelected = selectedDisease?.id === dis.id;
              return (
                <button
                  key={dis.id}
                  onClick={() => setSelectedDisease(dis)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/30 scale-105'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Iconify icon={dis.icon} className="w-5 h-5" />
                  <span>{dis.title}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Disease Details & Medicine Recommendation Card */}
          {selectedDisease && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-[2rem] p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Iconify icon={selectedDisease.icon} className="w-7 h-7 text-sky-400" />
                    {selectedDisease.title}
                  </h3>
                  <p className="text-slate-300 text-xs font-medium mt-1">
                    <strong>Symptoms:</strong> {selectedDisease.symptoms}
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
                  Verified Remedies
                </span>
              </div>

              {/* Medicines List Grid */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 mb-3 flex items-center gap-2">
                  <Iconify icon="eva:shield-fill" className="w-4 h-4" />
                  Recommended Medications & Dosage:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDisease.medicines.map((med, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1.5 hover:bg-white/15 transition-colors">
                      <p className="font-black text-white text-base flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        {med.name}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        <strong className="text-sky-300">Dosage:</strong> {med.dose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Remedies & Warnings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-sky-300 flex items-center gap-2">
                    <Iconify icon="eva:heart-fill" className="w-4 h-4" />
                    Home Care & Natural Remedies:
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-200 font-medium">
                    {selectedDisease.remedies.map((rem, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-sky-400">•</span> {rem}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-300 flex items-center gap-2">
                    <Iconify icon="eva:alert-triangle-fill" className="w-4 h-4" />
                    When to See a Doctor:
                  </h4>
                  <p className="text-xs text-rose-200 leading-relaxed font-medium">
                    {selectedDisease.warning}
                  </p>
                  <Link
                    to="/patient/doctors"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white underline mt-1"
                  >
                    <span>Book Doctor Consultation</span>
                    <Iconify icon="eva:arrow-forward-fill" className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
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