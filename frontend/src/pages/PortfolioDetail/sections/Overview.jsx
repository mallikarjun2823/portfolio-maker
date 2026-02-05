import React from 'react';
import { useOutletContext } from 'react-router-dom';
import PortfolioOverview from '../../../components/PortfolioOverview/PortfolioOverview';

export default function Overview() {
  const { portfolio, projects, skills, education, documents, isOwner, openProjectModal, openSkillModal, openEducationModal, openSocialLinkModal, setShowDocumentModal, setShowVersionModal } = useOutletContext();

  return (
    <div>
      <PortfolioOverview
        portfolio={portfolio}
        projects={projects}
        skills={skills}
        isOwner={isOwner}
        onAddProject={openProjectModal}
        onAddSkill={openSkillModal}
        onAddEducation={openEducationModal}
        onAddSocialLink={openSocialLinkModal}
        onUploadDocument={() => setShowDocumentModal(true)}
        onCreateVersion={() => setShowVersionModal(true)}
      />
    </div>
  );
}
