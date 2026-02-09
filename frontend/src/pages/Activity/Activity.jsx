import React, { useState, useEffect } from 'react';
import { portfolioService, versionService } from '../../api/services';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

const Activity = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const portfolios = await portfolioService.getPortfolios();

      // Prefer the portfolio the user owns. Avoid using a public portfolio
      // (which may be the first in the list) because versions endpoints
      // are owner-only and will return 403.
      const userPortfolio = portfolios.find(p => p.is_owner);
      if (!userPortfolio) {
        // No owned portfolio — activity timeline is private to owners
        setAccessRestricted(true);
        setPortfolio(null);
        setVersions([]);
        return;
      }

      setPortfolio(userPortfolio);

      try {
        const versionsData = await versionService.getVersions(userPortfolio.id);
        // Sort by version number descending (newest first)
        const sortedVersions = [...versionsData].sort((a, b) => b.version_number - a.version_number);
        setVersions(sortedVersions);
      } catch (err) {
        // If the server returns 403, treat as restricted/private and show
        // a friendly explanation rather than a raw error box.
        if (err?.response?.status === 403) {
          setAccessRestricted(true);
          setVersions([]);
          setPortfolio(userPortfolio);
          return;
        }
        throw err;
      }
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(err.response?.data?.message || 'Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityTitle = (version) => {
    const status = version.is_draft ? 'Draft' : 'Published';
    return `Version ${version.version_number} - ${status}`;
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (accessRestricted) {
    return (
      <div className="container py-4">
        <div className="card-component p-4">
          <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <div style={{width:40, height:40, borderRadius:8, background:'#fff2f2', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 style={{margin:0, color:'var(--color-gray-100)'}}>Activity Is Private</h3>
              <p style={{margin:'6px 0 0', color:'var(--color-gray-200)'}}>Version history and activity are visible only to the portfolio owner. If this is your portfolio, sign in with the owner account or create your own portfolio to track activity.</p>
              <div style={{marginTop:12}}>
                <button className="btn btn-primary btn-sm" onClick={() => { window.location.href = '/portfolios'; }}>View/Create Portfolio</button>
                <button style={{marginLeft:8}} className="btn btn-outline btn-sm" onClick={() => { window.location.href = '/'; }}>Go to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <ErrorMessage title="Activity Error" message={error} />
      </div>
    );
  }

  const displayedVersions = versions.slice(0, displayCount);
  const hasMore = versions.length > displayCount;

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h4">Activity Timeline</h1>
        <p className="text-muted">Track all changes and versions of your portfolio</p>
      </div>

      {versions.length === 0 ? (
        <EmptyState icon={null} title="No Activity Yet" description="Your portfolio activity and version history will appear here" />
      ) : (
        <>
          <div className="list-group">
            {displayedVersions.map((version) => (
              <div key={version.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">{getActivityTitle(version)}</div>
                    <div className="text-muted small">{formatDate(version.created_at)}</div>
                  </div>
                  <div>
                    <Badge status={version.is_draft ? 'DRAFT' : 'PUBLISHED'} size="small" />
                  </div>
                </div>
                {version.change_note && <div className="mt-2">{version.change_note}</div>}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-3">
              <Button onClick={handleLoadMore} variant="secondary">Load More Activity</Button>
            </div>
          )}

          {!hasMore && versions.length > 10 && (
            <div className="mt-3 text-muted small">Showing all {versions.length} activities</div>
          )}
        </>
      )}
    </div>
  );
};

export default Activity;
