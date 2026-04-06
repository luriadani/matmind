import React from 'react';
import { VideoCard } from '../ui/VideoCard';
import { useAppContext } from '../Localization';

const TechniqueCard = ({ technique, trainings, onDelete, onUpdate, compact = false }) => {
  const { t } = useAppContext();

  return (
    <VideoCard
      technique={technique}
      trainings={trainings}
      onDelete={onDelete}
      onUpdate={onUpdate}
      deleteLabel={t('technique.delete_title')}
      deleteConfirmTitle={t('technique.delete_title')}
      deleteConfirmMessage={t('technique.delete_message')}
    />
  );
};

export default TechniqueCard;
