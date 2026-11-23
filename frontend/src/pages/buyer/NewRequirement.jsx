import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SelectField from '../../components/SelectField';
import InputField from '../../components/InputField';

export const NewRequirement = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form fields matching CreateBuyerRequirementRequest exactly
  const [formData, setFormData] = useState({
    cropId: '',
    requiredQuantity: '',
    maxPricePerKg: '',
    minQualityGrade: 'B',
    preferredLocation: '',
    requiredByDate: '',
  });

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      setLoadingCrops(true);
      const res = await buyerApi.getCrops();
      const data = res.data?.data || res.data || [];
      setCrops(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setFormData((prev) => ({ ...prev, cropId: data[0].cropId }));
      }
    } catch (err) {
      console.error('Failed to load crop catalog:', err);
      setError('Failed to load agricultural commodity catalog.');
    } finally {
      setLoadingCrops(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const qty = parseFloat(formData.requiredQuantity);
    const price = parseFloat(formData.maxPricePerKg);

    if (!formData.cropId) {
      setError('Please select a crop commodity.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Required quantity must be a positive number greater than 0 kg.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError('Maximum price per kg must be greater than ₹0.');
      return;
    }
    if (!formData.preferredLocation.trim()) {
      setError('Preferred delivery location is required.');
      return;
    }
    if (!formData.requiredByDate) {
      setError('Required-by date is required.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.requiredByDate < todayStr) {
      setError('Required-by date cannot be in the past.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cropId: Number(formData.cropId),
        requiredQuantity: qty,
        maxPricePerKg: price,
        minQualityGrade: formData.minQualityGrade,
        preferredLocation: formData.preferredLocation.trim(),
        requiredByDate: formData.requiredByDate,
      };

      const res = await buyerApi.createRequirement(payload);
      const created = res.data?.data || res.data;
      const reqId = created?.requirementId;

      if (reqId) {
        navigate(`/buyer/requirements/${reqId}`);
      } else {
        navigate('/buyer/requirements');
      }
    } catch (err) {
      console.error('Failed to post requirement:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit buyer requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post Commercial Crop Requirement</h1>
        <p className="text-sm text-gray-500 mt-1">
          Specify your agricultural procurement criteria. AgriConnect will evaluate and rank matching verified farmer lots.
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {loadingCrops ? (
          <LoadingSpinner message="Loading commodity specifications..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Crop Commodity */}
            <SelectField
              label="Crop Commodity"
              required
              name="cropId"
              value={formData.cropId}
              onChange={handleChange}
              options={crops.map((c) => ({
                value: c.cropId,
                label: `${c.cropName} (${c.category}) — Season: ${c.season}`
              }))}
            />

            {/* Volume & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Required Volume"
                required
                type="number"
                name="requiredQuantity"
                step="0.01"
                min="1"
                placeholder="e.g. 500"
                suffix="kg"
                value={formData.requiredQuantity}
                onChange={handleChange}
              />

              <InputField
                label="Maximum Ceiling Price"
                required
                type="number"
                name="maxPricePerKg"
                step="0.01"
                min="0.1"
                placeholder="e.g. 45.00"
                suffix="₹/kg"
                value={formData.maxPricePerKg}
                onChange={handleChange}
              />
            </div>

            {/* Quality Grade & Required Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Minimum Quality Grade Standard"
                required
                name="minQualityGrade"
                value={formData.minQualityGrade}
                onChange={handleChange}
                options={[
                  { value: 'A', label: 'Grade A (Premium Quality ≥ 80 pts)' },
                  { value: 'B', label: 'Grade B (Standard Commercial ≥ 60 pts)' },
                  { value: 'C', label: 'Grade C (Industrial / Processing Grade)' },
                ]}
              />

              <InputField
                label="Required-By Date"
                required
                type="date"
                name="requiredByDate"
                value={formData.requiredByDate}
                onChange={handleChange}
              />
            </div>

            {/* Preferred Delivery Location */}
            <InputField
              label="Preferred Destination / Receiving Warehouse"
              required
              type="text"
              name="preferredLocation"
              maxLength={150}
              placeholder="e.g. APMC Market Yard, Pune, Maharashtra"
              value={formData.preferredLocation}
              onChange={handleChange}
              helperText="Used by the matching engine to calculate proximity and logistic convenience scores."
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/buyer/requirements')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting Requirement...' : 'Post Requirement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewRequirement;
