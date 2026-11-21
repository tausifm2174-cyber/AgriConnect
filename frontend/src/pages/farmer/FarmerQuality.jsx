import React, { useState, useEffect } from 'react';
import farmerApi from '../../services/farmerApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { ShieldCheck, Wheat, CheckCircle2, AlertTriangle, Clock, Award, Info } from 'lucide-react';

export const FarmerQuality = () => {
  const [harvests, setHarvests] = useState([]);
  const [qualityMap, setQualityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQualityData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await farmerApi.getHarvests();
        // Backend returns ApiResponse { data: List<HarvestResponse> }
        const harvestList = res.data || [];
        setHarvests(harvestList);

        // Fetch quality assessment for each harvest lot
        const qResults = await Promise.all(
          harvestList.map(async (h) => {
            try {
              const qRes = await farmerApi.getHarvestQuality(h.harvestId);
              return { harvestId: h.harvestId, quality: qRes.data || null };
            } catch (err) {
              return { harvestId: h.harvestId, quality: null };
            }
          })
        );

        const mapping = {};
        qResults.forEach((item) => {
          mapping[item.harvestId] = item.quality;
        });
        setQualityMap(mapping);
      } catch (err) {
        console.error('Failed to load quality reports:', err);
        setError(err.message || 'Unable to retrieve produce quality evaluation telemetry.');
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <ShieldCheck size={26} color="var(--color-primary)" />
          <span>Agricultural Quality Assessments & Grade Audits</span>
        </h1>
        <p className="page-subtitle">
          Scientific inspection metrics (freshness, visual appearance, sizing, color, ripeness, defect threshold) verified by authorized platform assessors.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Authority Notice Box */}
      <div style={{
        backgroundColor: 'var(--color-primary-subtle)',
        border: '1px solid var(--color-primary-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--color-primary)'
      }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>System Integrity Rule:</strong> Quality verification and grade certification (Grade A / B / C) are calculated and authorized strictly through the system/admin inspection workflow. Farmers have transparent read-only access to all verified reports.
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Auditing quality reports for your harvest lots..." />
      ) : harvests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Wheat size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Produce Lots Available</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            List a harvest lot to initiate formal quality inspection.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {harvests.map((h) => {
            const qa = qualityMap[h.harvestId];
            return (
              <div key={h.harvestId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        LOT #{h.harvestId}
                      </span>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {h.cropName}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {h.location} • {h.availableQuantity} kg
                      </div>
                    </div>

                    {qa ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <StatusBadge status={qa.qualityGrade} type="grade" />
                        <StatusBadge status={qa.verificationStatus} />
                      </div>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-warning-bg)',
                        color: 'var(--color-warning)'
                      }}>
                        AWAITING AUDIT
                      </span>
                    )}
                  </div>

                  {qa ? (
                    <div>
                      {/* Score Banner */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-bg-alt)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        margin: '1rem 0'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Calculated Quality Score
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {qa.qualityScore} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/ 100</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Inspection Date
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {qa.assessmentDate || '--'}
                          </div>
                        </div>
                      </div>

                      {/* 6 Dimension Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Freshness</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.freshness}/10</div>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Appearance</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.appearance}/10</div>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Size Caliber</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.size}/10</div>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Color</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.color}/10</div>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Ripeness</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.ripeness}/10</div>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ color: 'var(--color-text-muted)' }}>Damage Defect</div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.1rem' }}>{qa.damagePercentage}%</div>
                        </div>
                      </div>

                      {qa.inspectorNotes && (
                        <div style={{
                          marginTop: '0.875rem',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: 'var(--color-bg-alt)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic'
                        }}>
                          "{qa.inspectorNotes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-bg-alt)',
                      borderRadius: 'var(--radius-md)',
                      margin: '1rem 0'
                    }}>
                      <Clock size={28} color="var(--color-warning)" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        Inspection Pending
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        Admin quality grading will appear once official sample evaluation is recorded.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmerQuality;
