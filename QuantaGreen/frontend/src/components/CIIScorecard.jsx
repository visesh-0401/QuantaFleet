import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, TrendingDown, BookOpen } from 'lucide-react';

export default function CIIScorecard({ ciiData }) {
  const grades = [
    { grade: 'A', label: 'Major Superior Performance', color: '#10b981', desc: 'Attained CII ≤ 82% of reference line. Eligible for port tariff discounts and premium charter rates.' },
    { grade: 'B', label: 'Minor Superior Performance', color: '#38bdf8', desc: 'Attained CII 83%–94% of reference line. High commercial demand.' },
    { grade: 'C', label: 'Moderate / Standard Compliant', color: '#f59e0b', desc: 'Attained CII 95%–106% of reference line. Baseline regulatory compliance.' },
    { grade: 'D', label: 'Minor Inferior Performance', color: '#fb923c', desc: 'Attained CII 107%–118%. Required corrective action plan if consecutive for 3 years.' },
    { grade: 'E', label: 'Inferior Non-Compliant', color: '#ef4444', desc: 'Attained CII > 118%. Immediate corrective action plan required; risk of port detention and charter cancellations.' },
  ];

  const distribution = ciiData?.grade_distribution || { A: 3, B: 2, C: 2, D: 0, E: 0 };
  const assessments = ciiData?.fleet_assessments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} color="#10b981" /> IMO MARPOL Annex VI Carbon Intensity Indicator (CII)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px' }}>
              Mandatory operational carbon intensity rating framework enforced by the International Maritime Organization (IMO).
            </p>
          </div>
          <span className="badge badge-green">MEPC.337(76) Standard</span>
        </div>
      </div>

      {/* Grade Distribution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
        {grades.map((g) => {
          const count = distribution[g.grade] || 0;
          return (
            <div
              key={g.grade}
              className="glass-panel"
              style={{
                padding: '16px',
                borderTop: `4px solid ${g.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: g.color }}>
                  {g.grade}
                </span>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#f1f5f9'
                }}>
                  {count} <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 400 }}>vessels</span>
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', marginTop: '4px' }}>
                {g.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                {g.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vessel Compliance Table */}
      <div className="glass-panel" style={{ padding: '18px' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} color="#10b981" /> Fleet Regulatory Audit & Ratings
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Vessel ID</th>
                <th style={{ padding: '8px' }}>Vessel Name</th>
                <th style={{ padding: '8px' }}>Vessel Type</th>
                <th style={{ padding: '8px' }}>Fuel Type</th>
                <th style={{ padding: '8px' }}>Attained CII (gCO₂/dwt·nm)</th>
                <th style={{ padding: '8px' }}>IMO Rating</th>
                <th style={{ padding: '8px' }}>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => {
                const gradeInfo = grades.find((g) => g.grade === a.cii_rating) || grades[2];
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '9px 8px', fontFamily: 'var(--font-mono)' }}>{a.vessel_id}</td>
                    <td style={{ padding: '9px 8px', fontWeight: 600, color: '#f1f5f9' }}>{a.vessel_name}</td>
                    <td style={{ padding: '9px 8px', color: '#94a3b8' }}>{a.vessel_type}</td>
                    <td style={{ padding: '9px 8px' }}>
                      <span className="badge badge-quantum">{a.fuel_type}</span>
                    </td>
                    <td style={{ padding: '9px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {a.attained_cii}
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: `${gradeInfo.color}22`,
                        color: gradeInfo.color,
                        fontWeight: 800,
                        border: `1px solid ${gradeInfo.color}44`,
                      }}>
                        Grade {a.cii_rating}
                      </span>
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      {a.cii_rating === 'A' || a.cii_rating === 'B' || a.cii_rating === 'C' ? (
                        <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Full Compliance
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Corrective Plan Required
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
