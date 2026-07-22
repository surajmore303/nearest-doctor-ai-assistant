import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../../api-config";
import Iconify from '../common/Iconify';

const MedicalRecord = () => {
  const { id } = useParams();
  const [patientUploaded, setPatientUploaded] = useState([]);

  const loadPatientUploadedRecords = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/records/${id}`);
      let records = [];
      if (res.data && res.data.length > 0 && res.data[0].notes) {
        records = res.data[0].notes;
      }

      // Check localStorage for patient uploaded records
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('patient_records_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            records = [...records, ...parsed];
          } catch (e) {}
        }
      }

      const unique = records.filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.diseaseTitle === v.diseaseTitle && t.recordDate === v.recordDate)) === i);
      setPatientUploaded(unique);
    } catch (err) {
      console.log('Error loading patient uploaded records:', err);
    }
  }, [id]);

  useEffect(() => {
    loadPatientUploadedRecords();
  }, [loadPatientUploadedRecords]);

  const cards = [
    {
      title: "Active Problems",
      desc: "Current medical concerns requiring monitoring.",
      icon: "eva:alert-circle-fill",
      color: "rose",
      viewPath: `/doctor/record/activeproblem/${id}`,
      addPath: `/doctor/record/addactiveproblem/${id}`
    },
    {
      title: "Archive / History",
      desc: "Resolved medical issues and past conditions.",
      icon: "eva:archive-fill",
      color: "slate",
      viewPath: `/doctor/record/oldproblem/${id}`,
      addPath: `/doctor/record/addoldproblem/${id}`
    },
    {
      title: "Clinical Notes",
      desc: "Internal diagnostic commentary and observations.",
      icon: "eva:edit-2-fill",
      color: "sky",
      viewPath: `/doctor/record/doctornote/${id}`,
      addPath: `/doctor/record/addnote/${id}`
    },
    {
      title: "Genetics",
      desc: "Family history and hereditary health patterns.",
      icon: "eva:activity-fill",
      color: "amber",
      viewPath: `/doctor/record/hereditary/${id}`,
      addPath: `/doctor/record/addhereditary/${id}`
    },
    {
      title: "Lab Diagnostics",
      desc: "Recent blood work and laboratory reports.",
      icon: "eva:beaker-fill",
      color: "emerald",
      viewPath: `/doctor/record/reslabo/${id}`,
      addPath: `/doctor/record/addreslabo/${id}`
    }
  ];

  return (
    <div className="space-y-10 pt-6">
      {/* Uploaded Patient Records & Past Doctor Consultations Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 md:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center font-black">
              <Iconify icon="eva:folder-add-fill" className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Patient Uploaded Records & Past Doctors</h2>
              <p className="text-xs text-sky-500 font-bold uppercase tracking-widest mt-1">Disease History & Past Consultation Reports</p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 font-black text-xs">
            {patientUploaded.length} Records
          </span>
        </div>

        {patientUploaded.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patientUploaded.map((rec) => (
              <div key={rec.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-3 relative group hover:border-sky-200 hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-lg group-hover:text-sky-600 transition-colors">{rec.diseaseTitle}</h3>
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-wider">
                    {rec.category || 'Record'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-600 font-medium">
                    <strong className="text-slate-900">Past Doctor:</strong> {rec.pastDoctor}
                  </p>
                  <p className="text-slate-600 font-medium">
                    <strong className="text-slate-900">Consultation Date:</strong> {rec.recordDate}
                  </p>
                  {rec.attachmentName && (
                    <p className="text-sky-600 font-bold flex items-center gap-1">
                      <Iconify icon="eva:attach-fill" className="w-4 h-4" />
                      {rec.attachmentName}
                    </p>
                  )}
                </div>

                {rec.notes && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                    <strong>Diagnosis & Notes:</strong> {rec.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            <Iconify icon="eva:file-text-outline" className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            No patient-uploaded records found for this case file yet.
          </div>
        )}
      </div>

      {/* Standard Dossier Sub-sections */}
      <div>
        <h3 className="text-2xl font-black text-slate-900 mb-6">Clinical Dossier Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="group bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 p-8 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${card.color}-50 text-${card.color}-500 transition-colors group-hover:bg-${card.color}-500 group-hover:text-white shadow-sm`}>
                  <Iconify icon={card.icon} className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{card.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                <Link
                  to={card.viewPath}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-${card.color}-500 text-white font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-${card.color}-500/10 no-underline`}
                >
                  <Iconify icon="eva:maximize-fill" className="w-4 h-4" />
                  Analyze
                </Link>
                <Link
                  to={card.addPath}
                  className="w-12 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all no-underline"
                >
                  <Iconify icon="eva:plus-fill" className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecord;
