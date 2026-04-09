import { useState, useEffect, memo } from "react";
import { X, Save, Loader2 } from "lucide-react";

const JobFormModal = memo(({
  isOpen,
  onClose,
  onSave,
  job = null,
  title = "Job Details"
}) => {
  const [formData, setFormData] = useState({
    job_name: "",
    job_number: "",
    dig_tess_number: "",
    customer_name: "",
    hiring_contractor: "",
    hiring_contact_name: "",
    hiring_contact_phone: "",
    hiring_contact_email: "",
    address: "",
    city: "",
    zip: "",
    pm_name: "",
    pm_phone: "",
    default_rig: "",
    crane_required: false,
    is_active: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({
        ...formData,
        ...job
      });
    } else {
      setFormData({
        job_name: "",
        job_number: "",
        dig_tess_number: "",
        customer_name: "",
        hiring_contractor: "",
        hiring_contact_name: "",
        hiring_contact_phone: "",
        hiring_contact_email: "",
        address: "",
        city: "",
        zip: "",
        pm_name: "",
        pm_phone: "",
        default_rig: "",
        crane_required: false,
        is_active: true,
      });
    }
  }, [job, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.job_name?.trim()) {
      newErrors.job_name = "Job name is required";
    }

    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = "Customer name is required";
    }

    if (formData.hiring_contact_email && !formData.hiring_contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.hiring_contact_email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
              <div className="grid grid-cols-2 gap-4">
                {/* Job Information */}
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Job Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    value={formData.job_name}
                    onChange={(e) => handleChange('job_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.job_name ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {errors.job_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.job_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Job Number
                  </label>
                  <input
                    type="text"
                    value={formData.job_number}
                    onChange={(e) => handleChange('job_number', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_name ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Dig/Tess Number
                  </label>
                  <input
                    type="text"
                    value={formData.dig_tess_number}
                    onChange={(e) => handleChange('dig_tess_number', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location Information */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Location</h3>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Contact Information */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Contacts</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Hiring Contractor
                  </label>
                  <input
                    type="text"
                    value={formData.hiring_contractor}
                    onChange={(e) => handleChange('hiring_contractor', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.hiring_contact_name}
                    onChange={(e) => handleChange('hiring_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.hiring_contact_phone}
                    onChange={(e) => handleChange('hiring_contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.hiring_contact_email}
                    onChange={(e) => handleChange('hiring_contact_email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hiring_contact_email ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {errors.hiring_contact_email && (
                    <p className="mt-1 text-xs text-red-600">{errors.hiring_contact_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    value={formData.pm_name}
                    onChange={(e) => handleChange('pm_name', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    PM Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.pm_phone}
                    onChange={(e) => handleChange('pm_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Equipment */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Equipment</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Default Rig
                  </label>
                  <input
                    type="text"
                    value={formData.default_rig}
                    onChange={(e) => handleChange('default_rig', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crane_required}
                      onChange={(e) => handleChange('crane_required', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">Crane Required</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

JobFormModal.displayName = "JobFormModal";

export default JobFormModal;