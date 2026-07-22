import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../api-config";
import { useParams, useNavigate } from "react-router-dom";
import Iconify from "../../components/common/Iconify";
import { MOCK_DOCTORS } from "../../constants/mockRecords";
import AuthService from "../../services/auth.service";

function DoctorDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = AuthService.getCurrentUser();
    const [doctor, setDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgBody, setMsgBody] = useState('');
    const [msgSubject, setMsgSubject] = useState('');
    const [msgSent, setMsgSent] = useState(false);
    const [sending, setSending] = useState(false);

    // Book Appointment Modal States
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [reason, setReason] = useState('');
    const [bookingSending, setBookingSending] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const handleSendMessage = async () => {
        if (!msgBody.trim()) return;
        setSending(true);
        try {
            await axios.post(`${API_BASE_URL}/messages/send`, {
                senderId: currentUser?.id,
                senderName: currentUser?.username,
                doctorId: id,
                subject: msgSubject || 'General Inquiry',
                body: msgBody
            });
            setMsgSent(true);
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        if (!bookingDate || !bookingTime) return;
        setBookingSending(true);
        try {
            const doctorName = doctor ? `Dr. ${doctor.firstname} ${doctor.lastname}` : 'Doctor';
            const startIso = new Date(`${bookingDate}T${bookingTime}`).toISOString();

            // 1. Create Appointment in MongoDB
            await axios.post(`${API_BASE_URL}/Appointments/${currentUser?.id || 'guest'}`, {
                Firstname: currentUser?.username || 'Patient',
                Lastname: '',
                Email: currentUser?.email || '',
                Phone: phone,
                StartDate: startIso,
                DoctorName: doctorName,
                User: currentUser?.id
            });

            // 2. Send instant Message Notification to Doctor in MongoDB
            await axios.post(`${API_BASE_URL}/messages/send`, {
                senderId: currentUser?.id || 'guest',
                senderName: currentUser?.username || 'Patient',
                doctorId: id,
                subject: '📅 New Appointment Booked!',
                body: `Patient ${currentUser?.username || 'Patient'} (${currentUser?.email || 'No email'}) has booked an appointment for ${bookingDate} at ${bookingTime}. Phone: ${phone || 'N/A'}. Reason: ${reason || 'General Consultation'}`
            });

            // 3. Mark alert in localStorage for immediate sync across tabs
            localStorage.setItem('latest_appointment_alert', JSON.stringify({
                patientName: currentUser?.username || 'Patient',
                date: bookingDate,
                time: bookingTime,
                doctorName: doctorName,
                doctorId: id,
                timestamp: Date.now()
            }));

            setBookingSuccess(true);
        } catch (err) {
            console.error('Booking error:', err);
        } finally {
            setBookingSending(false);
        }
    };

    useEffect(() => {
        const getDoctorData = async () => {
            try {
                const res = await axios(`${API_BASE_URL}/users/user/${id}`);
                if (res.data && res.data.firstname) {
                    setDoctor(res.data);
                } else {
                    const mock = MOCK_DOCTORS.find(d => d._id === id) || MOCK_DOCTORS[0];
                    setDoctor(mock);
                }
            } catch (err) {
                console.log("Using mock doctor data due to error", err);
                const mock = MOCK_DOCTORS.find(d => d._id === id) || MOCK_DOCTORS[0];
                setDoctor(mock);
            }
        };
        getDoctorData();
    }, [id]);

    if (!doctor) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
    );

    const tabs = [
        { id: 'about', label: 'About', icon: 'eva:info-fill' },
        { id: 'experience', label: 'Experience', icon: 'eva:briefcase-fill' },
        { id: 'location', label: 'Clinic Location', icon: 'eva:pin-fill' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Book Appointment Modal */}
            {showBookModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-md relative">
                        <button 
                            onClick={() => { setShowBookModal(false); setBookingSuccess(false); }} 
                            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                        >
                            <Iconify icon="eva:close-fill" className="w-6 h-6" />
                        </button>

                        {bookingSuccess ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                                    <Iconify icon="eva:checkmark-circle-2-fill" className="w-10 h-10 animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Appointment Booked!</h3>
                                <p className="text-slate-500 text-sm font-medium">
                                    Your appointment request with <strong>Dr. {doctor?.firstname} {doctor?.lastname}</strong> has been saved in database and notified to their dashboard.
                                </p>
                                <button 
                                    onClick={() => { setShowBookModal(false); setBookingSuccess(false); navigate('/patient/appointments'); }}
                                    className="mt-4 px-8 py-3.5 rounded-2xl bg-sky-500 text-white font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all w-full shadow-lg shadow-sky-200"
                                >
                                    View My Appointments
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmBooking} className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center font-black text-lg">
                                        {doctor?.firstname?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Book Appointment</h3>
                                        <p className="text-xs text-sky-500 font-bold">Dr. {doctor?.firstname} {doctor?.lastname}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Select Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingDate} 
                                        onChange={(e) => setBookingDate(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Select Time</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={bookingTime} 
                                        onChange={(e) => setBookingTime(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        placeholder="+1 (555) 000-0000"
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reason / Symptoms (Optional)</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Describe reason for consultation..."
                                        value={reason} 
                                        onChange={(e) => setReason(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={bookingSending || !bookingDate || !bookingTime}
                                    className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-xs hover:bg-sky-600 transition-all disabled:opacity-50 shadow-lg shadow-sky-200 mt-2"
                                >
                                    {bookingSending ? 'Booking...' : 'Confirm Appointment'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMsgModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg relative">
                        <button onClick={() => { setShowMsgModal(false); setMsgSent(false); setMsgBody(''); setMsgSubject(''); }} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100">
                            <Iconify icon="eva:close-fill" className="w-6 h-6 text-slate-400" />
                        </button>
                        {msgSent ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                                    <Iconify icon="eva:checkmark-circle-2-fill" className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Message Sent!</h3>
                                <p className="text-slate-500">Dr. {doctor.firstname} {doctor.lastname} will receive your message.</p>
                                <button onClick={() => { setShowMsgModal(false); setMsgSent(false); setMsgBody(''); setMsgSubject(''); }} className="mt-8 px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold">Close</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 font-black text-xl">{doctor.firstname?.charAt(0)}</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Message Dr. {doctor.firstname} {doctor.lastname}</h3>
                                        <p className="text-xs text-sky-500 font-bold uppercase tracking-widest">{doctor.speciality || doctor.specialty || 'Medical Professional'}</p>
                                    </div>
                                </div>
                                <input type="text" placeholder="Subject (optional)" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-sm font-medium" />
                                <textarea placeholder="Write your message or report here..." value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={5} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 mb-6 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-sm font-medium resize-none" />
                                <button onClick={handleSendMessage} disabled={sending || !msgBody.trim()} className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-sm hover:bg-sky-600 transition-all disabled:opacity-50">
                                    {sending ? 'Sending...' : 'Send Message'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Premium Hero Section */}
            <div className="relative group rounded-[3.5rem] overflow-hidden bg-slate-900 shadow-2xl shadow-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
                
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full group-hover:bg-sky-500/30 transition-colors duration-500" />
                        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                            <img 
                                src={doctor.picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop"} 
                                alt={doctor.firstname}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-6 pt-4">
                        <div>
                            <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black uppercase tracking-widest">
                                {doctor.specialty || doctor.speciality || 'General Specialist'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-tight leading-none">
                                Dr. {doctor.firstname} {doctor.lastname}
                            </h1>
                            <p className="text-slate-400 font-medium text-lg mt-3 flex items-center justify-center md:justify-start gap-2">
                                <Iconify icon="eva:home-fill" className="w-5 h-5 text-sky-500" />
                                {doctor.cabinet || "Main Clinical Cabinet"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Experience</p>
                                <p className="text-white font-bold text-lg">{doctor.experience || "12+"} Years</p>
                            </div>
                            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-emerald-400 font-bold text-lg">Available Today</p>
                            </div>
                            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Patients</p>
                                <p className="text-white font-bold text-lg">2.5k+</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto md:pt-4">
                        <button 
                            onClick={() => setShowBookModal(true)}
                            className="w-full md:w-auto px-10 py-5 rounded-[1.8rem] bg-sky-500 text-white font-black text-sm uppercase tracking-widest hover:bg-sky-400 hover:scale-[1.02] transition-all shadow-xl shadow-sky-500/20 text-center cursor-pointer active:scale-95"
                        >
                            Book Appointment
                        </button>
                        <button
                            onClick={() => setShowMsgModal(true)}
                            className="w-full md:w-auto px-10 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md"
                        >
                            Send Message
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Tabs & Detailed Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
                <div className="space-y-8">
                    <div className="p-3 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-8 py-5 rounded-[2rem] font-black text-sm transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Iconify icon={tab.icon} className="w-6 h-6" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Contact Details</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                                    <Iconify icon="eva:phone-fill" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Phone Number</p>
                                    <p className="font-bold text-slate-700">{doctor.phone || "+1 (555) 000-0000"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Iconify icon="eva:email-fill" className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Email Address</p>
                                    <p className="font-bold text-slate-700 break-all text-sm leading-tight">{doctor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                                    <Iconify icon="eva:pin-fill" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Office Address</p>
                                    <p className="font-bold text-slate-700 leading-snug">{doctor.address || "Medical District, Building A, Suite 100"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="p-10 md:p-14 rounded-[4rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 min-h-[500px]">
                        {activeTab === 'about' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Biography</h3>
                                    <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                        {doctor.about || `Dr. ${doctor.firstname} is a highly accomplished ${doctor.specialty || doctor.speciality || 'specialist'} with a passion for patient-centered care. With extensive training from top medical institutions, they bring a wealth of knowledge and expertise to every consultation.`}
                                    </p>
                                </section>

                                {doctor.specializations && (
                                    <section>
                                        <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Specializations</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {doctor.specializations.map((spec, idx) => (
                                                <span key={idx} className="px-5 py-2.5 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm border border-slate-100">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Education</h3>
                                    <div className="space-y-8">
                                        {doctor.education?.map((edu, idx) => (
                                            <div key={idx} className="flex gap-6">
                                                <div className="relative">
                                                    <div className="w-1.5 h-full bg-slate-50 absolute left-1/2 -translate-x-1/2 rounded-full" />
                                                    <div className="w-12 h-12 rounded-2xl bg-white border-4 border-sky-500/20 shadow-lg flex items-center justify-center relative z-10">
                                                        <Iconify icon="eva:book-open-fill" className="w-5 h-5 text-sky-500" />
                                                    </div>
                                                </div>
                                                <div className="pt-1">
                                                    <h4 className="font-black text-slate-900 text-lg">{edu.school}</h4>
                                                    <p className="text-sky-500 font-bold text-sm tracking-wide">{edu.degree}</p>
                                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">{edu.year}</p>
                                                </div>
                                            </div>
                                        )) || (
                                            <div className="flex gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                                                    <Iconify icon="eva:book-open-fill" className="w-6 h-6 text-sky-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg">International Medical University</h4>
                                                    <p className="text-slate-500 font-medium">Doctor of Medicine (MD)</p>
                                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">2001 - 2007</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {doctor.achievements && (
                                    <section>
                                        <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Achievements</h3>
                                        <div className="space-y-4">
                                            {doctor.achievements.map((ach, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                                        <Iconify icon="eva:award-fill" className="w-5 h-5" />
                                                    </div>
                                                    <p className="font-bold text-emerald-900 text-sm">{ach}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'experience' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                    <Iconify icon="eva:briefcase-outline" className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detailed Experience coming soon</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto">We are currently verifying and updating the detailed professional history for Dr. {doctor.lastname}.</p>
                            </div>
                        )}

                        {activeTab === 'location' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Clinic Location</h3>
                                        <p className="text-slate-500 font-medium flex items-center gap-2">
                                            <Iconify icon="eva:home-fill" className="w-5 h-5 text-sky-500" />
                                            {doctor.cabinet || "Main Clinical Cabinet"}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all no-underline shadow-lg"
                                        >
                                            Get Directions
                                        </a>
                                    </div>
                                </div>

                                <div className="relative rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-inner group h-[400px]">
                                    <iframe
                                        title="Practice Location"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(doctor.address || 'San Francisco, CA')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                        className="grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                        allowFullScreen
                                    ></iframe>
                                    <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Live View Available</p>
                                    </div>
                                </div>

                                {doctor.cabinet_images && doctor.cabinet_images.length > 0 && (
                                    <section className="pt-8 border-t border-slate-50">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cabinet Catalogue</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500" />
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Office Tour</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {doctor.cabinet_images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden group/img cursor-zoom-in">
                                                    <img 
                                                        src={img} 
                                                        alt={`Cabinet View ${idx + 1}`} 
                                                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" 
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Iconify icon="eva:expand-fill" className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="p-8 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                        <Iconify icon="eva:car-fill" className="w-8 h-8 text-sky-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 mb-1">Getting There</h4>
                                        <p className="text-slate-500 text-sm font-medium">Located conveniently in the medical district with ample underground parking and accessible public transport nearby.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorDetails;
