import axios from "axios";
import jsPDF from 'jspdf';
import API_BASE_URL from "../../api-config";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Iconify from '../common/Iconify';
import { MOCK_MEDICAL_RECORDS } from "../../constants/mockRecords";
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js'

const Prescription = () => {
  const { id } = useParams();
  const [record, setRecord] = useState([]);

  useEffect(() => {
    const getRecords = async () => {
      try {
        const res = await axios(`${API_BASE_URL}/records/${id}`);
        if (res.data && res.data.length > 0) {
          setRecord(res.data);
        } else {
          setRecord(MOCK_MEDICAL_RECORDS[id] || MOCK_MEDICAL_RECORDS["default"]);
        }
      } catch (err) {
        setRecord(MOCK_MEDICAL_RECORDS[id] || MOCK_MEDICAL_RECORDS["default"]);
      }
    };
    getRecords();
  }, [id]);

  const onUpdate = async (object) => {
    await axios.put(`${API_BASE_URL}/records/${id}`, object);
  };

  const handleDelete = (ind) => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm mx-2',
        cancelButton: 'px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm mx-2'
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: 'Delete Prescription?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedRecord = [...record];
        updatedRecord.forEach((object) => {
          const i = object.prescripton.findIndex(p => p.description === ind.description);
          if (i > -1) {
            object.prescripton.splice(i, 1);
            onUpdate(object);
          }
        });
        setRecord(updatedRecord);
        swalWithBootstrapButtons.fire('Deleted!', 'Prescription removed.', 'success');
      }
    });
  };

  const printRx = (value, i) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont('helvetica','bold');
    doc.text('NearestDoctor - Prescription', margin, 12);
    doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Generated: ' + new Date().toLocaleString(), margin, 22);
    let y = 38;
    doc.setFillColor(241,245,249); doc.roundedRect(margin, y, pageW - margin*2, 44, 3, 3, 'F');
    doc.setTextColor(30,41,59); doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Prescription #' + (i + 1), margin + 4, y + 9);
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text('Description: ' + (value.description || 'N/A'), margin + 4, y + 18);
    doc.text('Prescribed by: Dr. ' + (value.doctor || 'Medical Expert'), margin + 4, y + 26);
    doc.text('Date: ' + new Date().toLocaleDateString(), margin + 4, y + 34);
    doc.text('Status: Active', margin + 4, y + 41);
    doc.setFontSize(7); doc.setTextColor(148,163,184); doc.setFont('helvetica','italic');
    doc.text('NearestDoctor - Confidential Medical Document', margin, 285);
    doc.save('Prescription_' + (i+1) + '_' + new Date().toISOString().slice(0,10) + '.pdf');
  };

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-500">
            <Iconify icon="eva:list-fill" className="w-6 h-6" />
          </div>
          Active Prescriptions
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {record[0]?.prescripton?.map((value, i) => (
          <div key={i} className="group bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 p-8 flex flex-col justify-between transition-all hover:shadow-xl relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescription #{i+1}</span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-wider">Clinical</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-slate-600 font-medium">
                  "{value.description}"
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-black text-xs">
                    {value.doctor?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescribed by</p>
                    <p className="text-sm font-bold text-slate-700">{value.doctor || 'Dr. Medical Expert'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <button onClick={() => printRx(value, i)} className="flex items-center gap-2 text-sky-500 font-bold text-xs hover:text-sky-600 transition-colors">
                <Iconify icon="eva:printer-fill" className="w-4 h-4" />
                Print Rx
              </button>
              <button 
                onClick={() => handleDelete(value)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <Iconify icon="eva:trash-2-outline" className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {(!record[0]?.prescripton || record[0]?.prescripton.length === 0) && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <Iconify icon="eva:file-text-outline" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No active prescriptions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescription;
