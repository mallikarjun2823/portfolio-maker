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
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const portfolios = await portfolioService.getPortfolios();
      
      if (portfolios.length > 0) {
        const userPortfolio = portfolios[0];
        setPortfolio(userPortfolio);

        const versionsData = await versionService.getVersions(userPortfolio.id);
        
        // Sort by version number descending (newest first)
        const sortedVersions = [...versionsData].sort((a, b) => b.version_number - a.version_number);
        setVersions(sortedVersions);
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
