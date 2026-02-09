import React, { useEffect, useState } from 'react';
import { profileService } from '../../api/services';

const Profile = () => {
  const [profile, setProfile] = useState({ username: '', email: '', bio: '', avatar: null });
  const [savedProfile, setSavedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        const p = { username: data.username, email: data.email, bio: data.bio || '', avatar: data.avatar || null };
        setProfile(p);
        setSavedProfile(p);
        setAvatarPreview(data.avatar || null);
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
    // If user navigated to profile with ?tab=settings or #settings, open edit mode
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settings' || window.location.hash === '#settings') {
        setIsEditing(true);
      }
    } catch (e) {}
  }, []);

  const handleChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setProfile(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      // include user fields so serializer (source='user.username') maps correctly
      fd.append('username', profile.username || '');
      fd.append('email', profile.email || '');
      fd.append('bio', profile.bio || '');
      // append avatar file if user selected a new file
      if (profile.avatar && profile.avatar instanceof File) {
        fd.append('avatar', profile.avatar);
      }
      const updated = await profileService.updateProfile(fd);
      const updatedProfile = { username: updated.username, email: updated.email, bio: updated.bio || '', avatar: updated.avatar || null };
      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setAvatarPreview(updated.avatar || null);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading profile…</div>;

  const handleInputChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => {
    if (savedProfile) {
      setProfile(savedProfile);
      setAvatarPreview(savedProfile.avatar || null);
    }
    setIsEditing(false);
  };

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h4 className="mb-3">My Profile</h4>
          {error && <div className="alert alert-danger">{error}</div>}

          {!isEditing ? (
            // Details card view
            <div className="row align-items-center">
              <div className="col-auto">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="text-muted">No avatar</div>
                )}
              </div>
              <div className="col">
                <h5 className="mb-1">{profile.username}</h5>
                <div className="text-muted mb-2">{profile.email}</div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{profile.bio || <span className="text-muted">No bio provided</span>}</p>
                <div>
                  <button className="btn btn-sm btn-outline-primary" onClick={startEdit}>Edit Profile</button>
                </div>
              </div>
            </div>
          ) : (
            // Edit form (existing form)
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Username</label>
                <input name="username" className="form-control" value={profile.username} onChange={handleInputChange} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Email</label>
                <input name="email" type="email" className="form-control" value={profile.email} onChange={handleInputChange} required />
              </div>

              <div className="col-12">
                <label className="form-label">Bio</label>
                <textarea name="bio" className="form-control" rows={4} value={profile.bio} onChange={handleChange} />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Avatar</label>
                <input type="file" accept="image/*" className="form-control" onChange={handleAvatarChange} />
              </div>
              <div className="col-12 col-md-6">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{ maxWidth: '120px', borderRadius: '6px' }} />
                ) : (
                  <div className="text-muted">No avatar</div>
                )}
              </div>

              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>Cancel Edit</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { window.location.href = '/'; }}>Back Home</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
