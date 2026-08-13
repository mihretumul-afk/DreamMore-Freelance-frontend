import React, { useState, useEffect } from 'react';
import { 
  User, Briefcase, DollarSign, Star, CheckCircle, Clock, MapPin, 
  Code2, Share2, Globe, Edit3, Save, X, Plus, Trash2, Award 
} from 'lucide-react';
import freelancerService from '../../services/freelancerService';
import { useAuth } from '../../context/AuthContext';

export default function FreelancerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    headline: '',
    overview: '',
    hourly_rate: '',
    experience_level: 'intermediate',
    location: '',
    github_url: '',
    linkedin_url: '',
    website: '',
    availability_status: 'available',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await freelancerService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setFormData({
          headline: res.data.headline || '',
          overview: res.data.overview || '',
          hourly_rate: res.data.hourly_rate || '',
          experience_level: res.data.experience_level || 'intermediate',
          location: res.data.location || '',
          github_url: res.data.github_url || '',
          linkedin_url: res.data.linkedin_url || '',
          website: res.data.website || '',
          availability_status: res.data.availability_status || 'available',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
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
      const res = await freelancerService.updateProfile(formData);
      if (res.success) {
        setProfile(res.data);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile details.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Notification Toast */}
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

        {/* Profile Card Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Avatar Circle */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-3xl text-indigo-400">
                    {profile?.user?.name ? profile.user.name.charAt(0).toUpperCase() : 'F'}
                  </div>
                </div>
                <div className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                  profile?.availability_status === 'available'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : profile?.availability_status === 'busy'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {profile?.availability_status || 'available'}
                </div>
              </div>

              {/* Title & Info */}
              <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile?.user?.name || user?.name}</h1>
                  <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-md font-mono uppercase">
                    Freelancer
                  </span>
                </div>

                <p className="text-lg font-medium text-slate-300">
                  {profile?.headline || 'No professional headline set yet.'}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-slate-400 pt-1">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="capitalize">{profile?.experience_level || 'Intermediate'} Level</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Action Button */}
            <div className="self-center md:self-start">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Hourly Rate</div>
              <div className="text-xl font-extrabold text-white mt-1">
                ${profile?.hourly_rate ? Number(profile.hourly_rate).toFixed(2) : '0.00'} <span className="text-xs text-slate-400 font-normal">/ hr</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Jobs Completed</div>
              <div className="text-xl font-extrabold text-indigo-400 mt-1">
                {profile?.completed_jobs_count || 0}
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Rating</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-500 font-medium">Total Earnings</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                ${profile?.total_earnings ? Number(profile.total_earnings).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content / Edit Form */}
        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Main Section (Overview & Skills) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Professional Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" /> Professional Summary
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile?.overview || 'No professional overview written yet. Click "Edit Profile" to share your expertise with potential employers!'}
                </p>
              </div>

              {/* Skills & Expertise */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" /> Skills & Tech Stack
                </h2>
                
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span 
                        key={skill.id} 
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {skill.name}
                        {skill.years_of_experience && (
                          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950 px-1.5 py-0.5 rounded">
                            {skill.years_of_experience}y exp
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No skills attached to profile yet.</p>
                )}
              </div>

            </div>

            {/* Right Sidebar (Links & Details) */}
            <div className="space-y-6">
              
              {/* External Links */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Social & Portfolio Links</h3>

                <div className="space-y-3">
                  {profile?.github_url ? (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-indigo-400 hover:underline">
                      <Code2 className="w-4 h-4 text-slate-400" /> GitHub Profile
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <Code2 className="w-4 h-4" /> GitHub not added
                    </div>
                  )}

                  {profile?.linkedin_url ? (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-indigo-400 hover:underline">
                      <Share2 className="w-4 h-4 text-slate-400" /> LinkedIn Profile
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <Share2 className="w-4 h-4" /> LinkedIn not added
                    </div>
                  )}

                  {profile?.website ? (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-indigo-400 hover:underline">
                      <Globe className="w-4 h-4 text-slate-400" /> Personal Website
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <Globe className="w-4 h-4" /> Website not added
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* EDIT PROFILE FORM */
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="text-xl font-extrabold text-white border-b border-slate-800 pb-4">
              Edit Freelancer Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Headline */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Professional Headline</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Full-Stack React & Laravel Developer"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Hourly Rate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hourly Rate ($ / hour)</label>
                <input
                  type="number"
                  step="0.01"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  placeholder="e.g. 75.00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Experience Level</label>
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                >
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate Level</option>
                  <option value="expert">Expert Level</option>
                </select>
              </div>

              {/* Availability Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Availability Status</label>
                <select
                  name="availability_status"
                  value={formData.availability_status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                >
                  <option value="available">Available for Work</option>
                  <option value="busy">Busy / Limited Capacity</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. New York, USA / Remote"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* GitHub URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">GitHub URL</label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  placeholder="https://github.com/yourusername"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Website */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Portfolio / Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all"
                />
              </div>

              {/* Overview / Bio */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Professional Overview</label>
                <textarea
                  rows={5}
                  name="overview"
                  value={formData.overview}
                  onChange={handleInputChange}
                  placeholder="Detail your technical background, project experience, and what value you bring to clients..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-slate-100 text-sm outline-none transition-all resize-y"
                />
              </div>

            </div>

            {/* Form Footer Actions */}
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
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
