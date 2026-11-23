import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import SelectField from '../../components/SelectField';
import InputField from '../../components/InputField';
import { Wheat, Plus, ArrowLeft, CheckCircle2, Calendar, MapPin, Tag } from 'lucide-react';

export const NewHarvest = () => {
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  // Form Fields matching CreateHarvestRequest DTO:
  // cropId (Integer), quantity (BigDecimal > 0), pricePerKg (BigDecimal > 0), harvestDate (LocalDate), location (String)
  const [cropId, setCropId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await farmerApi.getCrops();
        // Backend returns ApiResponse { data: List<CropResponse> }
        const cropList = res.data || [];
        setCrops(cropList);
        if (cropList.length > 0) {
          setCropId(String(cropList[0].cropId));
        }
      } catch (err) {
        console.error('Failed to load crop master catalog:', err);
        setError('Failed to load standard crop catalog from backend.');
      } finally {
        setLoadingCrops(false);
      }
    };

    fetchCrops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    setSubmitting(true);

    const payload = {
      cropId: parseInt(cropId, 10),
      quantity: parseFloat(quantity),
      pricePerKg: parseFloat(pricePerKg),
      harvestDate: harvestDate,
      location: location.trim(),
    };

    try {
      await farmerApi.createHarvest(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/farmer/harvests');
      }, 1500);
    } catch (err) {
      console.error('Failed to create harvest lot:', err);
      setError(err.message || 'Failed to list harvest lot. Please verify the submitted values.');
      setFieldErrors(err.errors || null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/farmer/harvests" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '0.75rem'
        }}>
          <ArrowLeft size={16} />
          <span>Back to My Harvests</span>
        </Link>
        <h1 className="page-title">
          <Wheat size={26} color="var(--color-primary)" />
          <span>List New Agricultural Produce Lot</span>
        </h1>
        <p className="page-subtitle">
          Submit verified harvest lot parameters to the AgriConnect marketplace for quality verification and buyer matching.
        </p>
      </div>

      <div className="card">
        {success ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <CheckCircle2 size={52} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Harvest Lot Created Successfully!
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Your lot has been saved in the database and is queued for quality grading. Redirecting to your inventory...
            </p>
          </div>
        ) : (
          <>
            <ErrorMessage
              message={error}
              errors={fieldErrors}
              onDismiss={() => { setError(null); setFieldErrors(null); }}
            />

            {loadingCrops ? (
              <LoadingSpinner message="Loading agricultural crop catalog..." />
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Crop Selection */}
                <SelectField
                  label="Select Agricultural Crop"
                  required
                  id="cropId"
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  options={crops.map((c) => ({
                    value: c.cropId,
                    label: `${c.cropName} (${c.category} • Season: ${c.season})`
                  }))}
                />

                {/* Quantity and Price Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <InputField
                    label="Initial Quantity"
                    required
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 500.00"
                    suffix="kg"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />

                  <InputField
                    label="Asking Price per kg"
                    required
                    id="pricePerKg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 28.50"
                    suffix="₹/kg"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                  />
                </div>

                {/* Harvest Date and Location Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <InputField
                    label="Date of Harvest"
                    required
                    id="harvestDate"
                    type="date"
                    icon={Calendar}
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                  />

                  <InputField
                    label="Harvest Location (Origin / Mandi)"
                    required
                    id="location"
                    type="text"
                    icon={MapPin}
                    placeholder="e.g. Nashik, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Financial Summary Preview */}
                {quantity && pricePerKg && Number(quantity) > 0 && Number(pricePerKg) > 0 && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-primary-subtle)',
                    border: '1px solid var(--color-primary-border)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        TOTAL ESTIMATED LOT VALUE
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {quantity} kg × ₹{pricePerKg} / kg
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{(Number(quantity) * Number(pricePerKg)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <Link to="/farmer/harvests" className="btn btn-secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <Plus size={18} />
                    <span>{submitting ? 'Submitting to Database...' : 'List Produce Lot'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewHarvest;
