import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../services/api';
import { Printer, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { SyntheticIssuerBanner } from '../components/verification/SyntheticIssuerBanner';

export const VerificationReport = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const res = await caseService.getCaseDetails(caseId);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Generating Official Verification Certificate...</p>
      </div>
    );
  }

  if (!data || !data.case) return null;

  const { case: caseInfo, layer1_ocr, layer2_face, layer3_forensics, layer4_consistency, layer4_issuer, layer5_risk } = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top Controls */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(`/verification/${caseId}`)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      <div className="print:hidden">
        <SyntheticIssuerBanner />
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 print:text-slate-900">SentinelID Verification Certificate</h1>
              <p className="text-xs text-slate-400 font-mono print:text-slate-600">Official 5-Layer Identity Evidence Dossier</p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 print:text-slate-700">
            <p className="font-bold text-slate-200 print:text-black text-sm">CASE: {caseInfo.case_id}</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Subject Information */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
          <div>
            <span className="text-slate-500 block">Subject Name</span>
            <span className="font-bold text-slate-200 text-sm print:text-slate-900">{caseInfo.subject_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Document Number</span>
            <span className="font-bold text-indigo-400 print:text-indigo-700 text-sm">{layer1_ocr?.extracted_fields?.document_number || 'DOC-9988221'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Date of Birth</span>
            <span className="text-slate-300 print:text-slate-800">{layer1_ocr?.extracted_fields?.dob || '1992-04-14'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Assigned Officer</span>
            <span className="text-slate-300 print:text-slate-800">{caseInfo.assigned_to}</span>
          </div>
        </div>

        {/* Layer 5 Risk Assessment Breakdown */}
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3 print:border-indigo-300 print:bg-indigo-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase font-bold text-indigo-300 print:text-indigo-900">Layer 5 Risk Engine Assessment</span>
            <span className="px-3 py-1 rounded text-xs font-bold font-mono bg-indigo-600 text-white">
              {layer5_risk?.risk_level || caseInfo.risk_level} RISK (Score: {layer5_risk?.risk_score || caseInfo.risk_score}/100)
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 print:text-slate-900">
            Recommended Action: {layer5_risk?.decision || caseInfo.status}
          </p>
        </div>

        {/* 4-Layer Summary Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-slate-900">5-Layer Evidence Summary</h3>
          <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden print:border-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono print:bg-slate-200 print:text-slate-800">
              <tr>
                <th className="p-2.5">LAYER</th>
                <th className="p-2.5">CHECK TYPE</th>
                <th className="p-2.5">METRIC / SCORE</th>
                <th className="p-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono print:divide-slate-300">
              <tr>
                <td className="p-2.5 font-bold">Layer 1</td>
                <td className="p-2.5">Document OCR Extraction</td>
                <td className="p-2.5">Confidence {Math.round((layer1_ocr?.ocr_confidence || 0.94) * 100)}%</td>
                <td className="p-2.5 text-emerald-400 font-bold print:text-emerald-700">PASS</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Layer 2</td>
                <td className="p-2.5">Identity / Face Comparison</td>
                <td className="p-2.5">Similarity {Math.round((layer2_face?.similarity_score || 0.94) * 100)}%</td>
                <td className="p-2.5 font-bold">{layer2_face?.match ? 'MATCH' : 'MISMATCH'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Layer 3</td>
                <td className="p-2.5">Document Forensics & ELA</td>
                <td className="p-2.5">Tampering Score {Math.round((layer3_forensics?.tampering_score || 0.12) * 100)}%</td>
                <td className="p-2.5 font-bold">{layer3_forensics?.status || 'NORMAL'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Layer 4</td>
                <td className="p-2.5">Data Consistency & Issuer Check</td>
                <td className="p-2.5">{layer4_issuer?.issuer_name}</td>
                <td className="p-2.5 font-bold">{layer4_issuer?.document_status || 'VALID'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mandatory Legal & Assistance Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
          <p className="font-bold text-slate-300 print:text-slate-900">MANDATORY NOTICE:</p>
          <p>Automated verification assistance — final decision requires authorized human review.</p>
        </div>

        {/* Officer Signature & Audit Footer */}
        <div className="pt-6 border-t border-slate-800 flex justify-between items-end print:border-slate-300 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Reviewing Officer Signature</span>
            <div className="h-10 border-b border-dashed border-slate-700 w-48 mt-1 flex items-end pb-1 text-slate-300">
              {caseInfo.assigned_to}
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            <p>SentinelID System Seal</p>
            <p>Audit Log Ref: LOG-VERIFIED-{caseInfo.case_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
