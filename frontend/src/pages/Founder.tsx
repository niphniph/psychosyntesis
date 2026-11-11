import React, { useEffect, useState } from 'react';
import { useSite } from '../content/SiteContext';
import { ArrowDown, ArrowUpRight, CheckCircle2, Award, BookOpen, GraduationCap } from 'lucide-react';

export const Founder: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { t, lines, go } = useSite();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const scrollToBiography = () => {
    const bioSection = document.getElementById('biography');
    if (bioSection) {
      bioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 relative overflow-hidden">
      {/* Background Interactive Ambient Orb */}
      <div 
        className="absolute top-1/4 left-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-tertiary-fixed/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-500 ease-out z-0"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
      />
      
      {/* Hero Section: Immersive Founder Introduction */}
      <section className="relative z-10 min-h-[70vh] flex items-center pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8 animate-fade-in">
            <div className="space-y-4">
              <span className="font-label-md text-label-md text-tertiary-fixed uppercase tracking-[0.2em] border-b border-tertiary-container/30 pb-2 w-max block">
                {t('founderLabel')}
              </span>
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-surface-bright leading-tight">
                {t('founderTitle')}
              </h1>
            </div>
            
            <p className="font-quote-editorial text-quote-editorial text-surface-variant/90 max-w-2xl italic border-l-2 border-tertiary-fixed pl-6 leading-relaxed">
              {t('founderSubtitle')}
            </p>
            
            <div className="pt-4">
              <button 
                onClick={scrollToBiography}
                className="px-8 py-4 bg-tertiary text-on-tertiary hover:bg-tertiary-container hover:text-on-tertiary-container rounded-xl font-label-md text-label-md flex items-center gap-2 transition-all duration-300 shadow-lg active:scale-95 group"
              >
                {t('founderBioButton')}
                <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Portrait */}
          <div className="lg:col-span-5 relative group w-full max-w-md mx-auto lg:max-w-none">
            <div className="absolute -inset-4 border border-tertiary-fixed/20 rounded-2xl translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] bg-primary-container border border-white/10">
              <img 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105" 
                alt={t('founderTitle')}
                src={t('founderImage')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Biography Section */}
      <section className="py-12 relative z-10 border-t border-white/5" id="biography">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Narrative */}
          <div className="lg:col-span-8 space-y-8">
            <h2 className="font-headline-lg text-headline-lg text-tertiary-container">
              {t('founderBioHeading')}
            </h2>
            <div className="space-y-6 text-surface-variant/90 font-body-lg text-body-lg leading-relaxed">
              <p className="bg-white/[0.03] p-6 rounded-2xl border border-tertiary-container/20 shadow-sm text-surface-bright">
                {t('founderBioText')}
              </p>
              <div className="cms-content" dangerouslySetInnerHTML={{ __html: t('founderBioBody') }} />
            </div>
          </div>

          {/* Fast Facts / Highlights */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-white/[0.02] p-8 rounded-2xl border border-tertiary-container/10 space-y-8 backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="font-label-md text-label-md text-tertiary-container uppercase tracking-widest text-xs">
                  {t('founderSpecTitle')}
                </h3>
                <ul className="space-y-3 font-body-md text-surface-variant/95">
                  {lines('founderSpecList').map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-tertiary-container shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="h-px bg-white/10"></div>
              
              <div className="space-y-3">
                <h3 className="font-label-md text-label-md text-tertiary-container uppercase tracking-widest text-xs">
                  {t('founderLangTitle')}
                </h3>
                <p className="text-surface-variant font-body-md">
                  {t('founderLanguages')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Achievements (Bento Grid) */}
      <section className="py-12 relative z-10 border-t border-white/5">
        <div className="space-y-12">
          <div className="space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-tertiary-container">
              {t('founderAchTitle')}
            </h2>
            <p className="text-surface-variant/70 font-body-md">
              {t('founderAchSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <div className="md:col-span-2 bg-white/[0.03] border border-tertiary-container/10 p-10 rounded-2xl flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:bg-white/[0.05] hover:border-tertiary-container/30 hover:-translate-y-1">
              <div>
                <span className="font-label-md text-label-md text-tertiary-container mb-4 block">
                  {t('ach1Meta')}
                </span>
                <h3 className="font-headline-md text-headline-md text-surface-bright mb-4">
                  {t('ach1Title')}
                </h3>
                <p className="text-surface-variant/80 font-body-md leading-relaxed">
                  {t('ach1Text')}
                </p>
              </div>
              {t('ach1LinkText') && <div onClick={() => t('ach1Link') && go(t('ach1Link'))} className="flex items-center gap-2 text-tertiary-container font-label-md hover:text-tertiary-fixed cursor-pointer w-max transition-colors pt-6">
                <span>{t('ach1LinkText')}</span>
                <ArrowUpRight size={16} />
              </div>}
            </div>

            {/* Small Card 1 */}
            <div className="bg-white/[0.03] border border-tertiary-container/10 p-8 rounded-2xl flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:bg-white/[0.05] hover:border-tertiary-container/30 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                  <GraduationCap size={24} />
                </div>
                <h4 className="font-headline-md text-lg text-surface-bright">
                  {t('ach2Title')}
                </h4>
                <p className="font-body-md text-sm text-surface-variant/70">
                  {t('ach2Text')}
                </p>
              </div>
            </div>

            {/* Small Card 2 */}
            <div className="bg-white/[0.03] border border-tertiary-container/10 p-8 rounded-2xl flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:bg-white/[0.05] hover:border-tertiary-container/30 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                  <Award size={24} />
                </div>
                <h4 className="font-headline-md text-lg text-surface-bright">
                  {t('ach3Title')}
                </h4>
                <p className="font-body-md text-sm text-surface-variant/70">
                  {t('ach3Text')}
                </p>
              </div>
            </div>

            {/* Medium Card */}
            <div className="md:col-span-2 bg-white/[0.03] border border-tertiary-container/10 p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-tertiary-container/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-tertiary-container/10 flex items-center justify-center shrink-0 text-tertiary-container">
                <BookOpen size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-headline-md text-lg text-surface-bright">
                  {t('ach4Title')}
                </h4>
                <p className="font-body-md text-surface-variant/70 text-sm leading-relaxed">
                  {t('ach4Text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trainers & Faculty Team Section */}
      <section className="py-12 relative z-10 border-t border-white/5 text-left space-y-6" id="trainers">
        <div className="space-y-2">
          <span className="font-label-md text-xs text-tertiary-fixed uppercase tracking-[0.2em] block">
            {t('founderTrainersLabel')}
          </span>
          <h2 className="font-headline-lg text-2xl md:text-3xl text-tertiary-container">
            {t('founderTrainersTitle')}
          </h2>
        </div>
        <div className="bg-white/[0.03] border border-tertiary-container/20 p-8 rounded-2xl space-y-4">
          <div className="cms-content text-surface-bright font-body-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t('trainersText') }} />
        </div>
      </section>

      {/* Philosophy Quote / Philosophy Break */}
      <section className="py-12 relative z-10 text-center max-w-4xl mx-auto space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-tertiary-fixed/5 blur-[120px] rounded-full pointer-events-none" />
        
        <span className="text-6xl text-tertiary-container font-display-lg opacity-30 block select-none">“</span>
        
        <blockquote className="font-display-lg text-quote-editorial md:text-display-lg-mobile lg:text-3xl text-surface-bright leading-snug italic text-balance">
          {t('founderQuote')}
        </blockquote>
        
        <div className="pt-4">
          <div className="h-px w-20 bg-tertiary-container/30 mx-auto"></div>
        </div>
      </section>
    </div>
  );
};
