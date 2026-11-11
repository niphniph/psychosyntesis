import React from 'react';
import { PracticeTimer } from '../components/PracticeTimer';
import { useSite } from '../content/SiteContext';

interface PracticeRoomProps {
  isAuthenticated: boolean;
}

export const PracticeRoom: React.FC<PracticeRoomProps> = ({ isAuthenticated }) => {
  const { t } = useSite();

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase font-label-md text-tertiary-container tracking-widest block">
          {t('practiceLabel')}
        </span>
        <h2 className="text-3xl font-headline-lg text-surface-bright">{t('practiceTitle')}</h2>
        <p className="text-sm text-surface-variant/80">
          {t('practiceSubtitle')}
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">
        <PracticeTimer isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
};
