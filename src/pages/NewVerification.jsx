import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseService, verificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Upload, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';

export const NewVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Info, 2: Doc Upload, 3: Face Upload, 4: Processing, 5: Results
  const [subjectDetails, setSubjectDetails] = useState({
    name: 'Eleanor Vance',
    dob: '1992-04-14',
    document_number: 'DOC-9988221',
    document_type: 'PASSPORT'
  });

  const [docFile, setDocFile] = useState(null);
  const [faceFile, setFaceFile] = useState(null);
  const [scenario, setScenario] = useState('NORMAL'); // 'NORMAL', 'TAMPERED', 'FACE_MISMATCH', 'EXPIRED'
  const [verificationResult, setVerificationResult] = useState(null);
  const [createdCaseId, setCreatedCaseId] = useState('');

  // Processing animation checklist state
  const [pipelineSteps, setPipelineSteps] = useState([
    { id: 1, label: 'Document Upload & Storage', status: 'pending' },
    { id: 2, label: 'Layer 1: OCR Text & Field Extraction', status: 'pending' },
    { id: 3, label: 'Layer 2: Face Feature Comparison', status: 'pending' },
    { id: 4, label: 'Layer 3: ELA & Forensic Tampering Scan', status: 'pending' },
    { id: 5, label: 'Layer 4: Data Consistency & Issuer Registry Check', status: 'pending' },
    { id: 6, label: 'Layer 5: Rule Engine Risk Calculation', status: 'pending' }
  ]);

  const handleStartPipeline = async () => {
    setStep(4);
    
    // Create Case first
    const newCase = await caseService.createCase(
      { subject_name: subjectDetails.name },
      user?.email
    );
    setCreatedCaseId(newCase.case_id);

    // Simulate animated step progression
    for (let i = 0; i < pipelineSteps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setPipelineSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'processing' } : (idx < i ? { ...s, status: 'complete' } : s)
      ));
    }

    // Run verification pipeline
    const results = await verificationService.startVerification(
      newCase.case_id,
      docFile,
      faceFile,
      subjectDetails,
      scenario
    );

    setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    setVerificationResult(results);
    setTimeout(() => {
      navigate(`/verification/${newCase.case_id}`);
    }, 800);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">New Verification Case Workflow</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Submit subject details and assets for 5-Layer Risk Evaluation</p>
      </div>

      <SyntheticIssuerBanner />

      {/* Progress Wizard Steps */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-mono">
        {[
          { num: 1, label: 'Subject Info' },
          { num: 2, label: 'ID Document' },
          { num: 3, label: 'Face Photo' },
          { num: 4, label: '5-Layer Pipeline' }
        ].map(s => (
          <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
              step === s.num ? 'bg-indigo-600 border-indigo-500 text-white' :
              step > s.num ? 'bg-indigo-950 border-indigo-700 text-indigo-300' : 'bg-slate-900 border-slate-800'
            }`}>
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: SUBJECT DETAILS */}
      {step === 1 && (
        <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Step 1 — Subject Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Full Name</label>
              <input
                type="text"
                required
                value={subjectDetails.name}
                onChange={e => setSubjectDetails({ ...subjectDetails, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Date of Birth</label>
              <input
                type="date"
                required
                value={subjectDetails.dob}
                onChange={e => setSubjectDetails({ ...subjectDetails, dob: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Document Number</label>
              <input
                type="text"
                required
                value={subjectDetails.document_number}
                onChange={e => setSubjectDetails({ ...subjectDetails, document_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">Document Type</label>
              <select
                value={subjectDetails.document_type}
                onChange={e => setSubjectDetails({ ...subjectDetails, document_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="PASSPORT">Passport Scan</option>
                <option value="NATIONAL_ID">National ID Card</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
              </select>
            </div>
          </div>

          {/* Quick Scenario Preset Selection for Demonstration */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider block">
              Demo Test Case Preset Simulator
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'NORMAL', label: 'Clean Genuine (Low Risk)' },
                { id: 'TAMPERED', label: 'Document Tampered (High Risk)' },
                { id: 'FACE_MISMATCH', label: 'Face Mismatch (High Risk)' },
                { id: 'EXPIRED', label: 'Expired Document (High Risk)' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id)}
                  className={`p-2 rounded-lg border text-[11px] font-medium text-left transition-all ${
                    scenario === s.id
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Next: Upload ID Document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ID DOCUMENT UPLOAD */}
      {step === 2 && (
        <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Step 2 — Upload Identity Document</h3>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center space-y-3 bg-slate-950/40 transition-all cursor-pointer">
            <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Drag and drop document scan or click to browse</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Supports JPG, PNG, WEBP (Max size: 10MB)</p>
            </div>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setDocFile(e.target.files[0])}
              className="hidden" 
              id="doc-upload" 
            />
            <label htmlFor="doc-upload" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer">
              {docFile ? docFile.name : 'Select File'}
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Next: Face Photo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FACE PHOTO UPLOAD / WEBCAM CAPTURE */}
      {step === 3 && (
        <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Step 3 — Capture / Upload Face Image</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-950 text-center space-y-3">
              <Camera className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-xs font-medium text-slate-300">Live Webcam Capture</p>
              <button 
                type="button" 
                onClick={() => setFaceFile({ name: 'webcam_capture.jpg' })}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow"
              >
                Simulate Capture
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl p-5 bg-slate-950 text-center space-y-3">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-xs font-medium text-slate-300">Upload Saved Photo</p>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setFaceFile(e.target.files[0])}
                className="hidden" 
                id="face-upload" 
              />
              <label htmlFor="face-upload" className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer">
                {faceFile ? faceFile.name : 'Choose Image'}
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleStartPipeline}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run 5-Layer Verification Engine</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PROCESSING PIPELINE ANIMATION */}
      {step === 4 && (
        <div className="glass-card rounded-xl p-8 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Executing 5-Layer Risk Analysis</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Cross-referencing evidence metrics and calculating transparent risk score</p>
          </div>

          <div className="max-w-md mx-auto space-y-2 text-left">
            {pipelineSteps.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="font-mono text-slate-300">{s.label}</span>
                {s.status === 'complete' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Done</span>
                ) : s.status === 'processing' ? (
                  <span className="text-indigo-400 font-bold flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Running</span>
                ) : (
                  <span className="text-slate-600 font-mono">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
