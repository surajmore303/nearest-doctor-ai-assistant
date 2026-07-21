import { useState } from 'react';
import jsPDF from 'jspdf';
import Iconify from '../../components/common/Iconify';
import { MOCK_MEDICAL_RECORDS } from '../../constants/mockRecords';
import AuthService from '../../services/auth.service';

function Records() {
    const [activeTab, setActiveTab] = useState('prescriptions');

    const tabs = [
        { id: 'prescriptions', label: 'Prescriptions', icon: 'eva:file-text-fill' },
        { id: 'allergies', label: 'Allergies', icon: 'eva:alert-triangle-fill' },
        { id: 'reports', label: 'Lab Reports', icon: 'eva:activity-fill' },
    ];

    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || "1";
    const record = MOCK_MEDICAL_RECORDS[userId] || MOCK_MEDICAL_RECORDS["default"];
    const patientRecord = record[0];

    const exportAllPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentW = pageW - margin * 2;
        let y = margin;
        const checkY = (n = 10) => { if (y + n > 280) { doc.addPage(); y = margin; } };

        // Header
        doc.setFillColor(14, 165, 233);
        doc.rect(0, 0, pageW, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text('NearestDoctor - Medical Records', margin, 12);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Patient: ' + (currentUser?.username || 'Unknown') + '   |   Generated: ' + new Date().toLocaleString(), margin, 22);
        y = 38;

        // Prescriptions
        doc.setTextColor(14, 165, 233); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('Prescriptions', margin, y); y += 6;
        doc.setDrawColor(14, 165, 233); doc.setLineWidth(0.4); doc.line(margin, y, pageW - margin, y); y += 5;
        prescriptions.forEach((p, i) => {
            checkY(14);
            doc.setFillColor(241, 245, 249); doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
            doc.setTextColor(30, 41, 59); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
            doc.text((i + 1) + '. ' + p.medicine, margin + 3, y + 5);
            doc.setFont('helvetica', 'normal');
            doc.text('Dr. ' + p.doctor + '   |   ' + p.date + '   |   ' + p.status, margin + 3, y + 10);
            y += 15;
        });
        if (prescriptions.length === 0) { doc.setTextColor(148,163,184); doc.setFontSize(8); doc.text('No prescriptions recorded.', margin, y); y += 8; }

        // Allergies
        y += 4; checkY(16);
        doc.setTextColor(14, 165, 233); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('Allergies', margin, y); y += 6;
        doc.setDrawColor(14, 165, 233); doc.line(margin, y, pageW - margin, y); y += 5;
        allergies.forEach((a, i) => {
            checkY(10);
            doc.setFillColor(255, 241, 242); doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F');
            doc.setTextColor(30, 41, 59); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
            doc.text((i + 1) + '. ' + (a.allergie || a), margin + 3, y + 5.5);
            y += 11;
        });
        if (allergies.length === 0) { doc.setTextColor(148,163,184); doc.setFontSize(8); doc.text('No allergies recorded.', margin, y); y += 8; }

        // Lab Reports
        y += 4; checkY(16);
        doc.setTextColor(14, 165, 233); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('Lab Reports', margin, y); y += 6;
        doc.setDrawColor(14, 165, 233); doc.line(margin, y, pageW - margin, y); y += 5;
        reports.forEach((r, i) => {
            checkY(10);
            doc.setFillColor(240, 249, 255); doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F');
            doc.setTextColor(30, 41, 59); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
            doc.text((i + 1) + '. ' + (r.test || r) + '   Result: ' + (r.result || 'N/A'), margin + 3, y + 5.5);
            y += 11;
        });
        if (reports.length === 0) { doc.setTextColor(148,163,184); doc.setFontSize(8); doc.text('No lab reports recorded.', margin, y); y += 8; }

        // Footer
        doc.setDrawColor(226,232,240); doc.setLineWidth(0.3); doc.line(margin, y + 4, pageW - margin, y + 4);
        doc.setFontSize(7); doc.setTextColor(148,163,184); doc.setFont('helvetica','italic');
        doc.text('NearestDoctor - Confidential Medical Record', margin, y + 9);
        doc.text('Page ' + doc.internal.getNumberOfPages(), pageW - margin, y + 9, { align: 'right' });

        doc.save('MedicalRecords_' + (currentUser?.username || 'patient') + '_' + new Date().toISOString().slice(0,10) + '.pdf');
    };

    const downloadPrescription = (p, i) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont('helvetica','bold');
        doc.text('NearestDoctor - Prescription', margin, 12);
        doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text('Generated: ' + new Date().toLocaleString(), margin, 22);
        let y = 38;
        doc.setFillColor(241,245,249); doc.roundedRect(margin, y, pageW - margin*2, 40, 3, 3, 'F');
        doc.setTextColor(30,41,59); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('Prescription #' + (i + 1), margin + 4, y + 8);
        doc.setFont('helvetica','normal'); doc.setFontSize(9);
        doc.text('Medicine: ' + p.medicine, margin + 4, y + 16);
        doc.text('Prescribed by: Dr. ' + p.doctor, margin + 4, y + 23);
        doc.text('Date: ' + p.date, margin + 4, y + 30);
        doc.text('Status: ' + p.status, margin + 4, y + 37);
        doc.setFontSize(7); doc.setTextColor(148,163,184); doc.setFont('helvetica','italic');
        doc.text('NearestDoctor - Confidential', margin, 285);
        doc.save('Prescription_' + (i+1) + '_' + new Date().toISOString().slice(0,10) + '.pdf');
    };

    const downloadLabReport = (r, i) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont('helvetica','bold');
        doc.text('NearestDoctor - Lab Report', margin, 12);
        doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text('Generated: ' + new Date().toLocaleString(), margin, 22);
        let y = 38;
        doc.setFillColor(240,249,255); doc.roundedRect(margin, y, pageW - margin*2, 30, 3, 3, 'F');
        doc.setTextColor(30,41,59); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('Lab Test #' + (i + 1), margin + 4, y + 8);
        doc.setFont('helvetica','normal'); doc.setFontSize(9);
        doc.text('Test: ' + (r.test || 'N/A'), margin + 4, y + 16);
        doc.text('Result: ' + (r.result || 'N/A'), margin + 4, y + 23);
        doc.setFontSize(7); doc.setTextColor(148,163,184); doc.setFont('helvetica','italic');
        doc.text('NearestDoctor - Confidential', margin, 285);
        doc.save('LabReport_' + (i+1) + '_' + new Date().toISOString().slice(0,10) + '.pdf');
    };

    // Map mock data to the tabs
    const prescriptions = patientRecord.medication?.map((m, idx) => ({
        id: idx,
        medicine: m.medica + " " + m.value,
        doctor: patientRecord.prescripton[idx]?.doctor || "Medical Team",
        date: "Oct 12, 2023",
        status: "Active"
    })) || [];

    const allergies = patientRecord.allergie || [];
    const reports = patientRecord.resLabo || [];

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Page Header */}
        <div className="flex flex-row items-center justify-between gap-6 pb-2">
            <div className="text-left">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight" id="main-title">
                    Medical <span className="text-sky-500">Records</span>
                </h1>
                <p className="text-slate-500 font-medium mt-1">Access your comprehensive medical history and prescriptions.</p>
            </div>
            <button onClick={exportAllPDF} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all shadow-sm whitespace-nowrap">
                <Iconify icon="eva:download-fill" className="w-5 h-5" />
                <span className="hidden sm:inline">Export All</span>
                <span className="sm:hidden text-xs">Export</span>
            </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[1.8rem] w-fit">
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

                            <div className="flex gap-3 ml-auto">
                                <button onClick={() => downloadPrescription(p, p.id)} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
                                    <Iconify icon="eva:download-outline" className="w-5 h-5" />
                                </button>
                                <button className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                                    Details
                                </button>
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
                                <button onClick={() => downloadLabReport(r, idx)} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
                                    <Iconify icon="eva:download-outline" className="w-5 h-5" />
                                </button>
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
                                <button className="px-8 py-4 rounded-2xl bg-sky-500 text-white font-bold shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all">
                                    Upload Report
                                </button>
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