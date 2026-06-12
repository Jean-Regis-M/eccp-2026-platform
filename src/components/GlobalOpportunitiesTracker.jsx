import React, { useState } from 'react';
import { useECCPState } from '../hooks/useECCPState';
import { useAuth } from '../context/AuthContext';

const GlobalOpportunitiesTracker = () => {
  const { opportunities, addOpportunityByAdmin, deleteOpportunityByAdmin } = useECCPState();
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    provider: '',
    category: 'fellowship',
    fieldOfStudy: '',
    region: 'Africa',
    openDate: '',
    deadline: '',
    stipendAmount: '',
    eligibility: '',
    officialUrl: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Opportunities');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle input changes for new opportunity form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOpportunity(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (submitError) setSubmitError(null);
  };

  // Validate the opportunity form
  const validateForm = () => {
    const errors = [];

    if (!newOpportunity.title.trim()) {
      errors.push('Title is required');
    }

    if (!newOpportunity.provider.trim()) {
      errors.push('Provider is required');
    }

    if (!newOpportunity.deadline.trim()) {
      errors.push('Deadline is required');
    }

    // Basic date validation - check if it looks like a date
    if (newOpportunity.deadline.trim() && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^[A-Za-z]+ \d{1,2}$|^\d{1,2} [A-Za-z]+$/.test(newOpportunity.deadline.trim())) {
      // Allow various date formats but note if it doesn't match common patterns
    }

    return errors;
  };

  // Handle submitting the new opportunity form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Basic validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join('. '));
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert comma-separated fieldOfStudy to array
      const fieldOfStudyArray = newOpportunity.fieldOfStudy
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean);

      const opportunity = {
        title: newOpportunity.title.trim(),
        provider: newOpportunity.provider.trim(),
        category: newOpportunity.category,
        fieldOfStudy: fieldOfStudyArray,
        region: newOpportunity.region,
        openDate: newOpportunity.openDate.trim(),
        deadline: newOpportunity.deadline.trim(),
        stipendAmount: newOpportunity.stipendAmount.trim(),
        eligibility: newOpportunity.eligibility.trim(),
        officialUrl: newOpportunity.officialUrl.trim() || undefined
      };

      await addOpportunityByAdmin(opportunity, user);
      setIsAddModalOpen(false);

      // Reset form
      setNewOpportunity({
        title: '',
        provider: '',
        category: 'fellowship',
        fieldOfStudy: '',
        region: 'Africa',
        openDate: '',
        deadline: '',
        stipendAmount: '',
        eligibility: '',
        officialUrl: ''
      });
    } catch (error) {
      console.error('Error adding opportunity:', error);
      setSubmitError('Failed to add opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter opportunities based on search term, category, and open state
  const filteredOpportunities = opportunities
    .filter(op => {
      const matchesSearch = op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           op.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           op.eligibility.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All Opportunities' ||
        (selectedCategory === 'Government Scholarships' && op.category === 'government') ||
        (selectedCategory === 'Global Fellowships' && op.category === 'fellowship') ||
        (selectedCategory === 'African Regionals' && op.category === 'local_regional' &&
        op.region === 'Africa') ||
        (selectedCategory === 'Chinese Excellence' && op.category === 'china_excellence');

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by deadline (earliest first) with error handling
      try {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();

        // If date is invalid, put it at the end
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateA - dateB;
      } catch (error) {
        console.error('Error sorting dates:', error);
        return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-equity-red">Global Opportunities & Scholarship Matrix</h2>
        {user?.role === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            Add Opportunity
          </button>
        )}
      </div>

      {/* Submit Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search Opportunities</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, provider, or eligibility..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
            >
              <option value="All Opportunities">All Opportunities</option>
              <option value="Government Scholarships">Government Scholarships</option>
              <option value="Global Fellowships">Global Fellowships</option>
              <option value="African Regionals">African Regionals</option>
              <option value="Chinese Excellence">Chinese Excellence</option>
            </select>
          </div>

          {/* Region Filter (optional enhancement) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
            <select
              onChange={(e) => {
                // We could add region filtering here if needed
                console.log('Region filter:', e.target.value);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
            >
              <option value="All Regions">All Regions</option>
              <option value="Africa">Africa</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="America">America</option>
              <option value="Global">Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-4">
        {filteredOpportunities.length === 0 ? (
          <div className="col-span-3 text-center py-8 bg-slate-50 rounded-lg">
            <p className="text-slate-500">No opportunities found matching your criteria.</p>
          </div>
        ) : (
          filteredOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1"
            >
              <div className="p-4">
                {/* Header with provider and admin controls */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-equity-red">{opportunity.title}</h3>
                    <p className="text-sm text-slate-600">By {opportunity.provider}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => deleteOpportunityByAdmin(opportunity.id, user)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Opportunity"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Main info grid */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="text-sm">
                    <span className="font-medium">Field of Study:</span> {opportunity.fieldOfStudy.join(', ')}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Region:</span> {opportunity.region}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Application Window:</span> {opportunity.openDate}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Deadline:</span> {opportunity.deadline}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Stipend/Funding:</span> {opportunity.stipendAmount}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Eligibility:</span> {opportunity.eligibility}
                  </div>
                  {opportunity.officialUrl && (
                    <div className="mt-2">
                      <a
                        href={opportunity.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-equity-red hover:text-equity-dark"
                      >
                        Official Website →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Opportunity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg mx-4 w-full max-w-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-equity-red">Add New Opportunity</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={newOpportunity.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider *</label>
                    <input
                      type="text"
                      name="provider"
                      value={newOpportunity.provider}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={newOpportunity.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    >
                      <option value="fellowship">Fellowship</option>
                      <option value="government">Government Scholarship</option>
                      <option value="local_regional">Local/Regional</option>
                      <option value="china_excellence">China Excellence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      value={newOpportunity.fieldOfStudy}
                      onChange={handleInputChange}
                      placeholder="Enter fields separated by commas (e.g., Computer Science, Engineering, Technology)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                    <select
                      name="region"
                      value={newOpportunity.region}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    >
                      <option value="Africa">Africa</option>
                      <option value="Asia">Asia</option>
                      <option value="Europe">Europe</option>
                      <option value="America">America</option>
                      <option value="Global">Global</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Application Window (Month)</label>
                    <input
                      type="text"
                      name="openDate"
                      value={newOpportunity.openDate}
                      onChange={handleInputChange}
                      placeholder="e.g., October"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deadline (Date)</label>
                    <input
                      type="text"
                      name="deadline"
                      value={newOpportunity.deadline}
                      onChange={handleInputChange}
                      placeholder="e.g., February 20"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Stipend/Funding Amount</label>
                    <input
                      type="text"
                      name="stipendAmount"
                      value={newOpportunity.stipendAmount}
                      onChange={handleInputChange}
                      placeholder="e.g., 3,500 TRY/month stipend + Full Accommodation"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Eligibility Requirements</label>
                    <textarea
                      name="eligibility"
                      value={newOpportunity.eligibility}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe eligibility criteria..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Official Website (Optional)</label>
                    <input
                      type="text"
                      name="officialUrl"
                      value={newOpportunity.officialUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-equity-red"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Adding Opportunity...' : 'Add Opportunity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalOpportunitiesTracker;
