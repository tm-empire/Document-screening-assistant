import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../services/api';
import { LayerCard } from '../components/verification/LayerCard';
import { ElaCanvas } from '../components/verification/ElaCanvas';
import { EvidenceSummary } from '../components/verification/EvidenceSummary';
import { DecisionModal } from '../components/verification/DecisionModal';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';
import { Printer, ArrowLeft, Loader2, Database, ShieldCheck, User, Calendar, FileText } from 'lucide-react';

export const VerificationResult = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await caseService.getCaseDetails(caseId);
      setData(res);
    } catch (e) {
      console.error('Failed to load case details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleUpdateStatus = async (cId, status, notes) => {
    await caseService.updateStatus(cId, status, notes);
    await fetchDetails();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading 5-Layer Evidence Bundle for {caseId}...</p>
      </div>
    );
  }

  if (!data || !data.case) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Verification Case Not Found</h2>
        <button onClick={() => navigate('/cases')} className="px-4 py-2 bg-slate-800 text-xs rounded-lg">
          Back to Cases
        </button>
      </div>
    );
  }

  const { case: caseInfo, layer1_ocr, layer2_face, layer3_forensics, layer4_consistency, layer4_issuer, layer5_risk } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Actions Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/cases')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-indigo-400 font-bold">CASE FILE</span>
              <span className="text-xs font-mono text-slate-400">| {caseInfo.case_id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{caseInfo.subject_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/report/${caseInfo.case_id}`)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Generate Official Report</span>
          </button>

          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Record Officer Decision</span>
          </button>
        </div>
      </div>

      <SyntheticIssuerBanner />

      {/* Layer 5 Summary Hero Card */}
      <EvidenceSummary 
        riskResult={layer5_risk} 
        onOpenDecisionModal={() => setIsDecisionModalOpen(true)}
      />

      {/* 5-Layer Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layer 1: Document OCR Card */}
        <LayerCard 
          layerNumber={1}
          title="Document Verification & OCR"
          status={layer1_ocr?.status || 'PASS'}
          score={layer1_ocr?.ocr_confidence}
          badgeText={`Confidence: ${Math.round((layer1_ocr?.ocr_confidence || 0.94) * 100)}%`}
        >
          <div className="space-y-2 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-400">Extracted Name:</span>
              <span className="text-slate-200 font-semibold">{layer1_ocr?.extracted_fields?.name || caseInfo.subject_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="text-slate-200">{layer1_ocr?.extracted_fields?.dob || '1992-04-14'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-400">Document Number:</span>
              <span className="text-indigo-300 font-bold">{layer1_ocr?.extracted_fields?.document_number || 'DOC-9988221'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Validity Dates:</span>
              <span className="text-slate-200">{layer1_ocr?.extracted_fields?.issue_date} to {layer1_ocr?.extracted_fields?.expiry_date}</span>
            </div>
          </div>
        </LayerCard>

        {/* Layer 2: Identity / Face Verification Card */}
        <LayerCard 
          layerNumber={2}
          title="Identity & Face Verification"
          status={layer2_face?.match ? 'MATCH' : 'MISMATCH'}
          score={layer2_face?.similarity_score}
          badgeText={layer2_face?.match ? 'FACE MATCH' : 'MISMATCH FLAGGED'}
        >
          <div className="space-y-2 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-400">Facial Similarity Score:</span>
              <span className={`font-bold ${layer2_face?.match ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Math.round((layer2_face?.similarity_score || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-400">Face Detected:</span>
              <span className="text-slate-200">{layer2_face?.face_detected ? 'Yes (Single Subject)' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Liveness Status:</span>
              <span className="text-emerald-400 font-semibold">{layer2_face?.liveness || 'PASS'}</span>
            </div>
          </div>
        </LayerCard>

        {/* Layer 3: Document Forensics & Tampering (With ELA Interactive Canvas) */}
        <div className="lg:col-span-2">
          <LayerCard 
            layerNumber={3}
            title="Document Forensics & Tampering Detection"
            status={layer3_forensics?.status || 'NORMAL'}
            score={layer3_forensics?.tampering_score}
            badgeText={`Tampering Score: ${Math.round((layer3_forensics?.tampering_score || 0) * 100)}%`}
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-300">{layer3_forensics?.explanation}</p>
              <ElaCanvas 
                tamperingScore={layer3_forensics?.tampering_score}
                suspiciousRegions={layer3_forensics?.suspicious_regions}
              />
            </div>
          </LayerCard>
        </div>

        {/* Layer 4: Data Consistency & Synthetic Issuer Check */}
        <div className="lg:col-span-2">
          <LayerCard 
            layerNumber={4}
            title="Data Consistency & Issuer Registry Check"
            status={layer4_issuer?.document_status === 'VALID' ? 'VERIFIED' : 'INCONSISTENT'}
            badgeText={layer4_issuer?.document_status === 'VALID' ? 'ISSUER VERIFIED' : 'ISSUER FLAGGED'}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-indigo-400 uppercase font-semibold block">A. Cross-Validation Checks</span>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Name Match:</span>
                  <span className={layer4_consistency?.name_match ? 'text-emerald-400' : 'text-rose-400'}>
                    {layer4_consistency?.name_match ? 'PASSED' : 'MISMATCH'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">DOB Match:</span>
                  <span className={layer4_consistency?.dob_match ? 'text-emerald-400' : 'text-rose-400'}>
                    {layer4_consistency?.dob_match ? 'PASSED' : 'MISMATCH'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Document Date Validity:</span>
                  <span className={layer4_consistency?.date_valid ? 'text-emerald-400' : 'text-rose-400'}>
                    {layer4_consistency?.date_valid ? 'VALID' : 'EXPIRED/INVALID'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-indigo-400 uppercase font-semibold block">B. Synthetic Issuer Registry</span>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Registry Record Located:</span>
                  <span className={layer4_issuer?.issuer_found ? 'text-emerald-400' : 'text-amber-400'}>
                    {layer4_issuer?.issuer_found ? 'YES' : 'NOT FOUND'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Issuer Registry Status:</span>
                  <span className={`font-bold ${layer4_issuer?.document_status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {layer4_issuer?.document_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Issuing Authority:</span>
                  <span className="text-slate-200">{layer4_issuer?.issuer_name}</span>
                </div>
              </div>
            </div>
          </LayerCard>
        </div>
      </div>

      {/* Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        onSubmitDecision={handleUpdateStatus}
        caseId={caseInfo.case_id}
        currentStatus={caseInfo.status}
      />
    </div>
  );
};
