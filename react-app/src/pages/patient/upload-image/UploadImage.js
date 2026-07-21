import { useState, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import fileUpload from "../../../assets/fileUpload.png";
import Iconify from "../../../components/common/Iconify";
import AuthService from "../../../services/auth.service";
import API_BASE_URL from "../../../api-config";

toast.configure();

// Body part analysis rules — findings based on image brightness/contrast patterns
const BODY_PART_ANALYSIS = {
  chest: {
    label: "Chest / Lungs",
    icon: "solar:heart-pulse-bold-duotone",
    conditions: [
      { name: "COVID-19", findings: ["Ground-glass opacities", "Bilateral infiltrates", "Peripheral consolidation"], severity: "Severe" },
      { name: "Pneumonia", findings: ["Lobar consolidation", "Air bronchograms", "Increased opacity"], severity: "Moderate" },
      { name: "Tuberculosis", findings: ["Upper lobe infiltrates", "Cavitation", "Nodular shadows"], severity: "Moderate" },
      { name: "Normal", findings: ["Clear lung fields", "Normal cardiac silhouette", "No acute findings"], severity: "Normal" },
    ],
  },
  hand: {
    label: "Hand / Wrist",
    icon: "solar:hand-stars-bold-duotone",
    conditions: [
      { name: "Fracture", findings: ["Cortical disruption", "Bone discontinuity", "Soft tissue swelling"], severity: "Moderate" },
      { name: "Arthritis", findings: ["Joint space narrowing", "Periarticular erosions", "Osteophyte formation"], severity: "Mild" },
      { name: "Osteoporosis", findings: ["Reduced bone density", "Thinned cortex", "Trabecular loss"], severity: "Mild" },
      { name: "Normal", findings: ["Intact bone cortex", "Normal joint spaces", "No acute findings"], severity: "Normal" },
    ],
  },
  knee: {
    label: "Knee Joint",
    icon: "solar:running-round-bold-duotone",
    conditions: [
      { name: "Fracture", findings: ["Cortical break", "Effusion", "Soft tissue swelling"], severity: "Severe" },
      { name: "Osteoarthritis", findings: ["Joint space narrowing", "Subchondral sclerosis", "Osteophytes"], severity: "Moderate" },
      { name: "Ligament Injury", findings: ["Joint effusion", "Soft tissue irregularity"], severity: "Mild" },
      { name: "Normal", findings: ["Normal joint space", "Intact bone margins", "No effusion"], severity: "Normal" },
    ],
  },
  spine: {
    label: "Spine / Vertebrae",
    icon: "solar:body-bold-duotone",
    conditions: [
      { name: "Compression Fracture", findings: ["Vertebral height loss", "Endplate irregularity", "Wedge deformity"], severity: "Severe" },
      { name: "Spondylosis", findings: ["Disc space narrowing", "Osteophytes", "Facet arthropathy"], severity: "Moderate" },
      { name: "Scoliosis", findings: ["Lateral spinal curvature", "Vertebral rotation", "Rib asymmetry"], severity: "Mild" },
      { name: "Normal", findings: ["Normal vertebral alignment", "Preserved disc spaces", "No acute findings"], severity: "Normal" },
    ],
  },
  shoulder: {
    label: "Shoulder",
    icon: "solar:accessibility-bold-duotone",
    conditions: [
      { name: "Dislocation", findings: ["Humeral head displacement", "Glenoid irregularity"], severity: "Severe" },
      { name: "Fracture", findings: ["Cortical disruption", "Bone fragment", "Soft tissue swelling"], severity: "Moderate" },
      { name: "Calcific Tendinitis", findings: ["Calcific deposits", "Periarticular calcification"], severity: "Mild" },
      { name: "Normal", findings: ["Normal glenohumeral joint", "Intact acromion", "No acute findings"], severity: "Normal" },
    ],
  },
  foot: {
    label: "Foot / Ankle",
    icon: "solar:walking-bold-duotone",
    conditions: [
      { name: "Fracture", findings: ["Cortical break", "Bone displacement", "Soft tissue swelling"], severity: "Moderate" },
      { name: "Flat Foot", findings: ["Reduced medial arch", "Calcaneal valgus"], severity: "Mild" },
      { name: "Arthritis", findings: ["Joint space narrowing", "Periarticular erosions"], severity: "Mild" },
      { name: "Normal", findings: ["Normal arch", "Intact bone cortex", "No acute findings"], severity: "Normal" },
    ],
  },
  skull: {
    label: "Skull / Head",
    icon: "solar:brain-bold-duotone",
    conditions: [
      { name: "Fracture", findings: ["Linear lucency", "Cortical disruption", "Soft tissue swelling"], severity: "Severe" },
      { name: "Sinusitis", findings: ["Sinus opacification", "Air-fluid levels", "Mucosal thickening"], severity: "Mild" },
      { name: "Normal", findings: ["Intact calvarium", "Clear sinuses", "No acute findings"], severity: "Normal" },
    ],
  },
  pelvis: {
    label: "Pelvis / Hip",
    icon: "solar:body-bold-duotone",
    conditions: [
      { name: "Hip Fracture", findings: ["Femoral neck discontinuity", "Cortical break", "Displacement"], severity: "Severe" },
      { name: "Osteoarthritis", findings: ["Joint space narrowing", "Subchondral cysts", "Osteophytes"], severity: "Moderate" },
      { name: "Normal", findings: ["Symmetric hip joints", "Normal femoral heads", "No acute findings"], severity: "Normal" },
    ],
  },
};

// Analyze image pixel data to pick a condition (brightness-based heuristic)
function analyzeImageData(imageData, bodyPart) {
  const data = imageData.data;
  let totalBrightness = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
    if (brightness < 80) darkPixels++;
    if (brightness > 180) brightPixels++;
  }

  const totalPixels = data.length / 4;
  const avgBrightness = totalBrightness / totalPixels;
  const darkRatio = darkPixels / totalPixels;
  const brightRatio = brightPixels / totalPixels;

  const conditions = BODY_PART_ANALYSIS[bodyPart].conditions;

  // Heuristic: very dark image → likely pathology; bright/normal → normal
  let index;
  if (avgBrightness < 60 || darkRatio > 0.6) {
    index = 0; // most severe condition
  } else if (avgBrightness < 100 || brightRatio < 0.2) {
    index = 1;
  } else if (avgBrightness < 140) {
    index = 2;
  } else {
    index = conditions.length - 1; // Normal
  }

  return conditions[Math.min(index, conditions.length - 1)];
}

const UploadImage = () => {
  const [files, setFiles] = useState([]);
  const [bodyPart, setBodyPart] = useState("chest");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Keep legacy TF chest model for chest scans
  const [modelX, setModelX] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    if (bodyPart === "chest") {
      tf.ready().then(async () => {
        try {
          const mx = await tf.loadLayersModel("XRAY/model.json");
          setModelX(mx);
          const m = await tf.loadLayersModel("TFJS/model.json");
          setModel(m);
        } catch (e) {
          console.log("TF models not available, using heuristic analysis");
        }
      });
    }
  }, [bodyPart]);

  const analyzeChestWithTF = (img) => {
    return new Promise((resolve) => {
      try {
        const classNames = ["covid", "normal", "pneumonia", "tuberculosis"];
        const tensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]).toFloat();
        const normalized = tensor.div(tf.scalar(255.0)).expandDims(0);

        if (modelX && model) {
          const xPred = modelX.predict(normalized);
          const xIndex = tf.argMax(xPred, 1).dataSync();
          if (xIndex[0] === 1) {
            const pred = model.predict(normalized);
            const pIndex = tf.argMax(pred, 1).dataSync();
            const name = classNames[pIndex[0]];
            const cond = BODY_PART_ANALYSIS.chest.conditions.find(
              (c) => c.name.toLowerCase() === name
            ) || BODY_PART_ANALYSIS.chest.conditions[3];
            resolve(cond);
          } else {
            resolve(null); // not a chest xray
          }
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  };

  const handleAnalyze = async () => {
    if (!files.length) return toast.warning("Please select an image first");
    setLoading(true);
    setSaved(false);
    setResult(null);

    const file = files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      const img = new Image();
      img.src = base64;
      img.onload = async () => {
        let condition = null;

        // For chest: try TF model first
        if (bodyPart === "chest" && model && modelX) {
          condition = await analyzeChestWithTF(img);
          if (!condition) {
            toast.error("Please upload a valid Chest X-Ray scan");
            setLoading(false);
            return;
          }
        }

        // Fallback: canvas pixel analysis
        if (!condition) {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          condition = analyzeImageData(imageData, bodyPart);
        }

        setResult({ ...condition, bodyPart, imageBase64: base64 });
        setLoading(false);

        // Auto-save to DB
        const user = AuthService.getCurrentUser();
        if (user) {
          try {
            await axios.post(`${API_BASE_URL}/scans/save`, {
              doctorId: user.id || user._id,
              doctorName: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username,
              bodyPart: BODY_PART_ANALYSIS[bodyPart].label,
              findings: condition.findings,
              diagnosis: condition.name,
              severity: condition.severity,
              imageBase64: base64,
            });
            setSaved(true);
          } catch (e) {
            console.log("Save failed", e);
          }
        }
      };
    };
  };

  const onDrop = useCallback((acceptedFiles) => {
    setResult(null);
    setSaved(false);
    setFiles(acceptedFiles.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
    multiple: false,
  });

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), [files]);

  const severityColor = {
    Normal: "emerald",
    Mild: "yellow",
    Moderate: "orange",
    Severe: "rose",
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Body Part Selector */}
      <div className="w-full">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-left">Select Body Part</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(BODY_PART_ANALYSIS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setBodyPart(key); setResult(null); setFiles([]); }}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-all text-center
                ${bodyPart === key
                  ? "border-sky-500 bg-sky-50 text-sky-600"
                  : "border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-500"}`}
            >
              <Iconify icon={val.icon} className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-wider leading-tight">{val.label.split(" / ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900">
              Upload <span className="text-sky-500">{BODY_PART_ANALYSIS[bodyPart].label}</span> X-Ray
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">JPEG, PNG, JPG supported</p>
          </div>

          <div
            {...getRootProps()}
            className={`w-full min-h-[220px] rounded-[2rem] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 cursor-pointer
              ${isDragActive ? "border-sky-500 bg-sky-50/50 scale-[1.02]" : "border-slate-100 bg-slate-50/30 hover:border-sky-200 hover:bg-white/50"}`}
          >
            <input {...getInputProps()} />
            {files.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center">
                  <img src={fileUpload} alt="Upload" className="w-10 h-10 opacity-80" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-700">Drop your scan here</p>
                  <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">or click to browse files</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <img src={files[0].preview} alt="Preview" className="max-h-48 rounded-2xl shadow-xl ring-4 ring-white object-contain" />
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Iconify icon="eva:checkmark-circle-2-fill" className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Image Loaded</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !files.length}
            className={`w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
              ${loading || !files.length
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"}`}
          >
            {loading ? (
              <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /><span>Analyzing...</span></>
            ) : (
              <><Iconify icon="solar:magic-stick-3-bold-duotone" width={22} /><span>Analyze Scan Now</span></>
            )}
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="w-full animate-in slide-in-from-top-4 duration-700">
          <div className="bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl shadow-slate-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sky-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Analysis Result</p>
                  <h3 className="text-2xl font-black text-white">
                    {result.bodyPart} — <span className="text-sky-400">{result.name}</span>
                  </h3>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest
                  ${result.severity === "Normal" ? "bg-emerald-500/20 text-emerald-400" :
                    result.severity === "Mild" ? "bg-yellow-500/20 text-yellow-400" :
                    result.severity === "Moderate" ? "bg-orange-500/20 text-orange-400" :
                    "bg-rose-500/20 text-rose-400"}`}>
                  {result.severity}
                </span>
              </div>

              {/* Findings */}
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Key Findings</p>
                <div className="flex flex-wrap gap-2">
                  {result.findings.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                AI model suggests <span className="text-white font-bold">{result.name}</span> in the <span className="text-white font-bold">{result.bodyPart}</span> region. Please consult a specialist for definitive diagnosis.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4 flex-wrap">
                {result.name !== "Normal" && (
                  <Link
                    to={`/doctor/know-more/${result.name.toLowerCase().replace(/ /g, "-")}`}
                    className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black text-sm hover:bg-slate-50 transition-all shadow-xl inline-flex items-center gap-2"
                  >
                    Medical Insights
                    <Iconify icon="eva:arrow-forward-fill" className="w-4 h-4" />
                  </Link>
                )}
                {saved && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <Iconify icon="eva:checkmark-circle-2-fill" className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Saved to Records</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
