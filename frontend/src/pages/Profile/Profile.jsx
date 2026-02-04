import React, { useEffect, useState } from 'react';
import { profileService } from '../../api/services';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState({ username: '', email: '', bio: '', avatar: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        setProfile({ username: data.username, email: data.email, bio: data.bio || '', avatar: data.avatar || null });
        setAvatarPreview(data.avatar || null);
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
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
      fd.append('bio', profile.bio || '');
      if (profile.avatar && profile.avatar instanceof File) {
        fd.append('avatar', profile.avatar);
      }
      const updated = await profileService.updateProfile(fd);
      setProfile({ username: updated.username, email: updated.email, bio: updated.bio || '', avatar: updated.avatar || null });
      setAvatarPreview(updated.avatar || null);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading profile…</div>;

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h4 className="mb-3">My Profile</h4>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Username</label>
              <input className="form-control" value={profile.username} readOnly />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" value={profile.email} readOnly />
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
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
