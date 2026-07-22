import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import Iconify from '../../components/common/Iconify';
import { MOCK_MEDICAL_RECORDS } from '../../constants/mockRecords';
import AuthService from '../../services/auth.service';
import axios from 'axios';
import API_BASE_URL from '../../api-config';
import Swal from 'sweetalert2';

function Records() {
    const [activeTab, setActiveTab] = useState('uploaded');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Upload Form State
    const [formData, setFormData] = useState({
        diseaseTitle: '',
        pastDoctor: '',
        recordDate: new Date().toISOString().split('T')[0],
        category: 'Prescription',
        notes: '',
        attachmentName: ''
    });

    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || "1";
    const mockRecord = MOCK_MEDICAL_RECORDS[userId] || MOCK_MEDICAL_RECORDS["default"];
    const patientRecord = mockRecord[0] || {};

    const [uploadedRecords, setUploadedRecords] = useState([]);

    // Load records from MongoDB and localStorage
    const loadPatientRecords = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/records/${userId}`);
            const mongoData = res.data?.[0];
            const mongoRecords = mongoData?.notes || [];

            // LocalStorage fallback
            const localSaved = JSON.parse(localStorage.getItem(`patient_records_${userId}`) || '[]');
            
            const combined = [...localSaved, ...mongoRecords];
            // Remove duplicates by id or timestamp
            const uniqueRecords = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.diseaseTitle === v.diseaseTitle && t.recordDate === v.recordDate)) === i);
            setUploadedRecords(uniqueRecords);
        } catch (err) {
            const localSaved = JSON.parse(localStorage.getItem(`patient_records_${userId}`) || '[]');
            setUploadedRecords(localSaved);
        }
    }, [userId]);

    useEffect(() => {
        loadPatientRecords();
    }, [loadPatientRecords]);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diseaseTitle || !formData.pastDoctor) return;
        setUploading(true);

        const newRecord = {
            id: 'rec_' + Date.now(),
            diseaseTitle: formData.diseaseTitle,
            pastDoctor: formData.pastDoctor,
            recordDate: formData.recordDate,
            category: formData.category,
            notes: formData.notes,
            attachmentName: formData.attachmentName || 'Medical_Document.pdf',
            patientName: currentUser?.username || 'Patient',
            patientEmail: currentUser?.email || 'patient@example.com',
            createdAt: new Date().toISOString()
        };

        try {
            // Save to MongoDB
            await axios.put(`${API_BASE_URL}/records/${userId}`, {
                userid: userId,
                record: {
                    notes: [newRecord, ...uploadedRecords]
                }
            });
        } catch (err) {
            console.log('Saved locally due to server offline', err);
        }

        // Save to LocalStorage for instant sync across Doctor & Patient panel
        const existingLocal = JSON.parse(localStorage.getItem(`patient_records_${userId}`) || '[]');
        const updatedLocal = [newRecord, ...existingLocal];
        localStorage.setItem(`patient_records_${userId}`, JSON.stringify(updatedLocal));
        localStorage.setItem('latest_uploaded_record', JSON.stringify({ ...newRecord, userId }));

        setUploadedRecords(updatedLocal);
        setUploading(false);
        setShowUploadModal(false);
        setFormData({
            diseaseTitle: '',
            pastDoctor: '',
            recordDate: new Date().toISOString().split('T')[0],
            category: 'Prescription',
            notes: '',
            attachmentName: ''
        });

        Swal.fire({
            icon: 'success',
            title: 'Medical Record Uploaded!',
            text: 'Your medical record and past doctor consultation details have been saved and shared with your doctor.',
            timer: 2500,
            showConfirmButton: false
        });
    };

    const tabs = [
        { id: 'uploaded', label: 'Uploaded Records & Past Doctors', icon: 'eva:folder-add-fill' },
        { id: 'prescriptions', label: 'Prescriptions', icon: 'eva:file-text-fill' },
        { id: 'allergies', label: 'Allergies', icon: 'eva:alert-triangle-fill' },
        { id: 'reports', label: 'Lab Reports', icon: 'eva:activity-fill' },
    ];

    const exportAllPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        doc.setFillColor(14, 165, 233);
        doc.rect(0, 0, pageW, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text('NearestDoctor - Medical History Dossier', margin, 12);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Patient: ' + (currentUser?.username || 'Patient') + '   |   Generated: ' + new Date().toLocaleString(), margin, 22);
        y = 40;

        doc.setTextColor(14, 165, 233); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('Uploaded Records & Past Doctor Consultations', margin, y); y += 6;
        doc.setDrawColor(14, 165, 233); doc.setLineWidth(0.4); doc.line(margin, y, pageW - margin, y); y += 6;

        if (uploadedRecords.length === 0) {
            doc.setTextColor(148,163,184); doc.setFontSize(9);
            doc.text('No custom medical records uploaded yet.', margin, y);
        } else {
            uploadedRecords.forEach((rec, idx) => {
                doc.setFillColor(241, 245, 249);
                doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, 'F');
                doc.setTextColor(30, 41, 59); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. Disease: ${rec.diseaseTitle}`, margin + 4, y + 6);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
                doc.text(`Past Consultant Doctor: ${rec.pastDoctor}   |   Date: ${rec.recordDate}   |   Category: ${rec.category}`, margin + 4, y + 12);
                doc.text(`Diagnosis / Notes: ${rec.notes || 'N/A'}`, margin + 4, y + 18);
                y += 26;
            });
        }

        doc.save(`MedicalRecords_${currentUser?.username || 'Patient'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const prescriptions = patientRecord.medication?.map((m, idx) => ({
        id: idx,
        medicine: m.medica + " " + m.value,
        doctor: patientRecord.prescripton?.[idx]?.doctor || "Medical Specialist",
        date: "Oct 12, 2023",
        status: "Active"
    })) || [];

    const allergies = patientRecord.allergie || [];
    const reports = patientRecord.resLabo || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Upload Medical Record Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-lg relative border border-slate-100">
                        <button 
                            onClick={() => setShowUploadModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                        >
                            <Iconify icon="eva:close-fill" className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center font-black text-xl shadow-inner">
                                <Iconify icon="eva:cloud-upload-fill" className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">Upload Medical Record</h2>
                                <p className="text-xs text-sky-500 font-bold uppercase tracking-widest mt-1">Disease & Past Doctor Consultation</p>
                            </div>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Disease / Health Condition Title *</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Typhoid Fever, Hypertension, Chest Pain"
                                    value={formData.diseaseTitle}
                                    onChange={(e) => setFormData({ ...formData, diseaseTitle: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Past Consultant Doctor *</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. Dr. Ramesh Sharma"
                                        value={formData.pastDoctor}
                                        onChange={(e) => setFormData({ ...formData, pastDoctor: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Consultation / Report Date *</label>
                                    <input 
                                        type="date"
                                        required
                                        value={formData.recordDate}
                                        onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Record Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                >
                                    <option value="Prescription">Prescription</option>
                                    <option value="Lab Report">Lab Report</option>
                                    <option value="Doctor Note">Doctor Note / Clinical Summary</option>
                                    <option value="Allergy">Allergy Record</option>
                                    <option value="Scan / X-Ray">Scan / X-Ray / MRI</option>
                                    <option value="General History">General Disease History</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diagnosis & Doctor Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter diagnosis details, prescribed medications, or advice from past doctor..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attachment File Name / Document Reference</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Typhoid_BloodReport_2024.pdf"
                                    value={formData.attachmentName}
                                    onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={uploading || !formData.diseaseTitle || !formData.pastDoctor}
                                className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-xs hover:bg-sky-600 transition-all shadow-lg shadow-sky-200 disabled:opacity-50 mt-2"
                            >
                                {uploading ? 'Uploading Record...' : 'Save & Share Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-6 pb-2">
                <div className="text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight" id="main-title">
                        Medical <span className="text-sky-500">Records</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Upload disease history, past doctor consultations, and prescriptions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all shadow-lg shadow-sky-200 whitespace-nowrap active:scale-95"
                    >
                        <Iconify icon="eva:cloud-upload-fill" className="w-5 h-5" />
                        <span className="hidden sm:inline">Upload Record</span>
                        <span className="sm:hidden text-xs">Upload</span>
                    </button>
                    <button 
                        onClick={exportAllPDF} 
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm whitespace-nowrap active:scale-95"
                    >
                        <Iconify icon="eva:download-fill" className="w-5 h-5" />
                        <span className="hidden sm:inline">Export PDF</span>
                        <span className="sm:hidden text-xs">PDF</span>
                    </button>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[1.8rem] w-fit flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-sky-500 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Iconify icon={tab.icon} className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'uploaded' && (
                    <div className="space-y-6">
                        {uploadedRecords.length > 0 ? (
                            uploadedRecords.map((rec) => (
                                <div key={rec.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-sky-50 transition-all duration-500 p-8 flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                        <Iconify icon="eva:file-text-fill" className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-sky-500 transition-colors">{rec.diseaseTitle}</h3>
                                            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-[10px] font-black uppercase tracking-widest">
                                                {rec.category || 'Medical Record'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm pt-1">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past Consultant Doctor</p>
                                                <p className="font-bold text-slate-700">{rec.pastDoctor}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultation Date</p>
                                                <p className="font-bold text-slate-700">{rec.recordDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attachment</p>
                                                <p className="font-bold text-sky-600 flex items-center gap-1">
                                                    <Iconify icon="eva:attach-fill" className="w-4 h-4" />
                                                    {rec.attachmentName || 'Document.pdf'}
                                                </p>
                                            </div>
                                        </div>
                                        {rec.notes && (
                                            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                                                <strong>Diagnosis & Notes:</strong> {rec.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-[3rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/50 p-20 text-center">
                                <div className="max-w-md mx-auto space-y-6">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-sky-50 flex items-center justify-center mx-auto">
                                        <Iconify icon="eva:cloud-upload-outline" className="w-12 h-12 text-sky-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">No Uploaded Records</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                            You haven't uploaded any past medical records yet. Upload your past doctor consultations and disease details so your doctor can review them.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowUploadModal(true)}
                                        className="px-8 py-4 rounded-2xl bg-sky-500 text-white font-bold shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all inline-flex items-center gap-2"
                                    >
                                        <Iconify icon="eva:plus-fill" className="w-5 h-5" />
                                        Upload Record Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="grid grid-cols-1 gap-6">
                        {prescriptions.map((p) => (
                            <div key={p.id} className="group bg-white rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-sky-50 transition-all duration-500 p-6 flex flex-col md:flex-row md:items-center gap-8">
                                <div className="flex items-center gap-5 md:w-1/3">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                                        <Iconify icon="eva:file-text-outline" className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 group-hover:text-sky-500 transition-colors">{p.medicine}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Prescribed Medicine</p>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Prescribed By</p>
                                        <p className="font-bold text-slate-700 uppercase tracking-tight text-xs tracking-wider">{p.doctor}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</p>
                                        <p className="font-bold text-slate-700">{p.date}</p>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                            p.status === 'Active' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'allergies' && (
                    <div className="space-y-6">
                        {allergies.length > 0 ? (
                            allergies.map((a, idx) => (
                                <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-6 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                        <Iconify icon="eva:alert-triangle-outline" className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">{a.allergie}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Known Allergy</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-[3rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/50 p-20 text-center">
                                <div className="max-w-xs mx-auto space-y-6">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 flex items-center justify-center mx-auto">
                                        <Iconify icon="eva:alert-triangle-outline" className="w-12 h-12 text-rose-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">No Allergies Recorded</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Your profile currently shows no known allergies.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {reports.length > 0 ? (
                            reports.map((r, idx) => (
                                <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-6 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                                        <Iconify icon="eva:activity-outline" className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900">{r.test}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Lab Result: {r.result}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-[3rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/50 p-20 text-center">
                                <div className="max-w-xs mx-auto space-y-6">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-sky-50 flex items-center justify-center mx-auto">
                                        <Iconify icon="eva:activity-outline" className="w-12 h-12 text-sky-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">No Reports Available</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Upload or synchronize your lab results to see them here.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Records;