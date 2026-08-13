import React, { useState, useEffect } from 'react';
import { useParams } from 'react';
import { 
  Building2, Globe, MapPin, Phone, Briefcase, DollarSign, Star, 
  Edit3, Save, X, ShieldCheck, Users, Info, PlusCircle 
} from 'lucide-react';
import employerService from '../../services/employerService';
import { useAuth } from '../../context/AuthContext';

export default function EmployerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    website: '',
    industry: '',
    company_size: '',
    location: '',
    phone: '',
    bio: '',
  });

  const isOwnProfile = !id || (user && (user.id === profile?.user_id || user.id === Number(id)));

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let res;
      if (id) {
        res = await employerService.getPublicProfile(id);
      } else {
        res = await employerService.getProfile();
      }

      if (res.success && res.data) {
        setProfile(res.data);
        setFormData({
          company_name: res.data.company_name || '',
          company_description: res.data.company_description || '',
          website: res.data.website || '',
          industry: res.data.industry || '',
          company_size: res.data.company_size || '10-50 employees',
          location: res.data.location || '',
          phone: res.data.user?.phone || '',
          bio: res.data.user?.bio || '',
        });
      }
    } catch (err) {
      console.error('Failed to load employer profile:', err);
      setMessage({ type: 'error', text: 'Could not load company profile details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await employerService.updateProfile(formData);
      if (res.success) {
        setProfile(res.data);
        setEditing(false);
        setMessage({ type: 'success', text: 'Employer company profile updated successfully!' });
      }
    } catch (err) {
      console.error('Failed to update employer profile:', err);
      const errText = err.response?.data?.message || 'Failed to update company profile.';
      setMessage({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading company profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Feedback Message Toast */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Employer Card Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Company Logo/Icon Container */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-1 shadow-xl">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-3xl text-purple-400">
                    <Building2 className="w-12 h-12" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Client
                </div>
              </div>

              {/* Company Name & Meta Info */}
              <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {profile?.company_name || profile?.user?.name || 'Company Name Not Set'}
                  </h1>
                  <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs px-2.5 py-1 rounded-md font-mono uppercase">
                    Employer
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-300">
                  {profile?.industry || 'Technology & Innovation'}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-slate-400 pt-1">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.company_size}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="self-center md:self-start flex items-center gap-3">
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  <Edit3 className="w-4 h-4" /> Edit Company Profile
                </button>
              )}
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Jobs Posted</div>
              <div className="text-xl font-extrabold text-purple-400 mt-1">
                {profile?.posted_jobs_count || 0}
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Total Spent</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                ${profile?.total_spent ? Number(profile.total_spent).toFixed(2) : '0.00'}
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500 font-medium">Employer Rating</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content / Edit Mode */}
        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Main Content */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Company Description */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" /> About the Company
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile?.company_description || 'No company description added yet. Click "Edit Company Profile" to share details about your organization, mission, and hiring goals.'}
                </p>
              </div>

              {/* Contact Bio / Hiring Representative */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-purple-400" /> Primary Hiring Contact
                </h2>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">{profile?.user?.name}</div>
                  <div className="text-xs text-slate-400">{profile?.user?.email}</div>
                  {profile?.user?.bio && (
                    <p className="text-xs text-slate-300 pt-2 italic">"{profile.user.bio}"</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              
              {/* Company Details */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Company Metadata</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-medium text-slate-200">{profile?.industry || 'Not specified'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Company Size:</span>
                    <span className="font-medium text-slate-200">{profile?.company_size || 'Not specified'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium text-slate-200">{profile?.user?.phone || 'Not provided'}</span>
                  </div>

                  {profile?.website ? (
                    <div className="pt-2">
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 w-full py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl transition-all font-semibold"
                      >
                        <Globe className="w-3.5 h-3.5" /> Visit Official Website
                      </a>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-1">Website not attached</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* EDIT COMPANY PROFILE FORM */
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="text-xl font-extrabold text-white border-b border-slate-800 pb-4">
              Edit Employer Company Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Company Name */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company / Business Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Tech Solutions LLC"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="e.g. Software & Artificial Intelligence"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Company Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Size</label>
                <select
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                >
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="10-50 employees">10-50 employees</option>
                  <option value="50-200 employees">50-200 employees</option>
                  <option value="200-500 employees">200-500 employees</option>
                  <option value="500+ employees">500+ employees</option>
                </select>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://acmetech.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Headquarters / Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. San Francisco, CA, USA"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Personal Bio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Representative Bio</label>
                <input
                  type="text"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Head of Talent Acquisition / Founder"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Company Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Description</label>
                <textarea
                  rows={5}
                  name="company_description"
                  value={formData.company_description}
                  onChange={handleInputChange}
                  placeholder="Describe your company's product, mission, technical stack, and what type of freelance talent you are hiring..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-4 text-slate-100 text-sm outline-none transition-all resize-y"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-4 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Company Profile'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
