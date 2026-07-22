import React, { useState, useEffect, useCallback } from 'react';
import Iconify from '../../components/common/Iconify';
import { Link } from 'react-router-dom';
import AuthService from "../../services/auth.service";
import Swal from 'sweetalert2';
import axios from 'axios';
import dayjs from 'dayjs';
import API_BASE_URL from '../../api-config';

const INITIAL_PATIENTS = [
    { id: 'p1', name: 'Jennifer Robinson', age: '35 years old', address: '1545 Dorsey Ln NE, Leland, NC, 28451', phone: '(207) 808 8863', email: 'jenniferrobinson@example.com', status: 'Registered' },
    { id: 'p2', name: 'Terry Baker', age: '63 years old', address: '555 Front St #APT 2H, Hempstead, NY, 11550', phone: '(376) 150 6975', email: 'terrybaker@example.com', status: 'Registered' },
    { id: 'p3', name: 'Kyle Bowman', age: '7 years old', address: '5060 Fairways Cir #APT 207, Vero Beach, FL, 32967', phone: '(981) 756 6128', email: 'kylebowman@example.com', status: 'Registered' },
    { id: 'p4', name: 'Marie Howard', age: '22 years old', address: '3501 New Haven Ave #152, Columbia, MO, 65201', phone: '(634) 09 3833', email: 'mariehoward@example.com', status: 'Registered' },
];

function Patients() {
    const currentUser = AuthService.getCurrentUser();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState(INITIAL_PATIENTS);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        phone: '',
        birthdate: '',
    });

    const loadDynamicPatients = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            // 1. Fetch appointments from MongoDB
            const appRes = await axios.get(`${API_BASE_URL}/Appointments/getAll/${currentUser.id}`);
            const appList = appRes.data?.appointments || [];

            // 2. Fetch messages from MongoDB
            const msgRes = await axios.get(`${API_BASE_URL}/messages/doctor/${currentUser.id}`);
            const msgList = msgRes.data || [];

            const fetchedPatients = [];

            // Map appointments into patient list
            appList.forEach((app, index) => {
                const fullName = `${app.Firstname || ''} ${app.Lastname || ''}`.trim() || 'Booked Patient';
                const formattedDate = app.StartDate ? dayjs(app.StartDate).format('MMM DD, YYYY · hh:mm A') : 'Scheduled';
                fetchedPatients.push({
                    id: app._id || `app-${index}`,
                    name: fullName,
                    age: 'Appointment Patient',
                    address: `Appointment: ${formattedDate}`,
                    phone: app.Phone || 'Not provided',
                    email: app.Email || 'No email registered',
                    status: 'Confirmed Appointment',
                    isConfirmed: true
                });
            });

            // Map message senders into patient list if not already added
            msgList.forEach((msg, index) => {
                if (msg.senderName && !fetchedPatients.some(p => p.name.toLowerCase() === msg.senderName.toLowerCase())) {
                    fetchedPatients.push({
                        id: msg._id || `msg-${index}`,
                        name: msg.senderName,
                        age: 'Inquired Patient',
                        address: msg.subject || 'Patient Consultation Request',
                        phone: 'Portal Message',
                        email: 'Patient Contact',
                        status: 'Active Contact',
                        isConfirmed: false
                    });
                }
            });

            if (fetchedPatients.length > 0) {
                setPatients(() => {
                    const combined = [...fetchedPatients];
                    INITIAL_PATIENTS.forEach(dummy => {
                        if (!combined.some(p => p.name.toLowerCase() === dummy.name.toLowerCase())) {
                            combined.push(dummy);
                        }
                    });
                    return combined;
                });
            }
        } catch (err) {
            console.log('Error fetching live patients from MongoDB:', err);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        loadDynamicPatients();
        const interval = setInterval(loadDynamicPatients, 4000);
        return () => clearInterval(interval);
    }, [loadDynamicPatients]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AuthService.register(
                formData.username,
                formData.email,
                formData.password,
                formData.birthdate,
                formData.firstname,
                formData.lastname,
                formData.phone,
                "user"
            );

            const newPatient = {
                id: Date.now(),
                name: `${formData.firstname} ${formData.lastname}`,
                age: formData.birthdate ? `${new Date().getFullYear() - new Date(formData.birthdate).getFullYear()} years old` : 'New Patient',
                address: 'Directly Registered Patient',
                phone: formData.phone,
                email: formData.email,
                status: 'Confirmed Patient',
                isConfirmed: true
            };

            setPatients(prev => [newPatient, ...prev]);
            setIsAddModalOpen(false);
            setFormData({
                username: '',
                email: '',
                password: '',
                firstname: '',
                lastname: '',
                phone: '',
                birthdate: '',
            });

            Swal.fire({
                icon: 'success',
                title: 'Patient Added',
                text: 'The new patient has been successfully registered.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Error',
                text: error.response?.data?.message || 'Could not register patient.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-6 pb-2">
                <div className="text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Patient <span className="text-sky-500">Directory</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage and view all patients with confirmed appointments.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
                >
                    <Iconify icon="eva:person-add-fill" className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Patient</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                        <Iconify icon="eva:people-outline" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Patients</p>
                        <p className="text-2xl font-black text-slate-900">{patients.length}</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <Iconify icon="eva:checkmark-circle-2-fill" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmed Appointments</p>
                        <p className="text-2xl font-black text-slate-900">{patients.filter(p => p.isConfirmed).length}</p>
                    </div>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Info & Schedule</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                                                {patient.name ? patient.name[0].toUpperCase() : 'P'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{patient.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{patient.age}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-700 font-medium max-w-[240px] truncate">{patient.address}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-700 font-medium">{patient.email}</p>
                                        <p className="text-xs text-slate-400 mt-1">{patient.phone}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                            patient.isConfirmed 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${patient.isConfirmed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {patient.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                to={`/doctor/record/medicalrecord/${patient.id}`}
                                                className="p-2.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white transition-all"
                                                title="View Medical Records"
                                            >
                                                <Iconify icon="eva:file-text-fill" className="w-5 h-5" />
                                            </Link>
                                            <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all">
                                                <Iconify icon="eva:edit-2-fill" className="w-5 h-5" />
                                            </button>
                                            <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all">
                                                <Iconify icon="eva:trash-2-fill" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Patient Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Register New Patient</h2>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Fill in the details to create a new patient account.</p>
                                </div>
                                <button 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                    <Iconify icon="eva:close-fill" className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddPatient} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                    <input 
                                        required
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                    <input 
                                        required
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                                    <input 
                                        required
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="johndoe123"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                    <input 
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                    <input 
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="(+216) 22 333 444"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birthdate</label>
                                    <input 
                                        required
                                        type="date"
                                        name="birthdate"
                                        value={formData.birthdate}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900 text-sm" 
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Temporary Password</label>
                                    <input 
                                        required
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-medium text-slate-900" 
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={loading}
                                    type="submit"
                                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Iconify icon="eva:checkmark-circle-2-fill" className="w-5 h-5" />
                                            <span>Create Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Patients;