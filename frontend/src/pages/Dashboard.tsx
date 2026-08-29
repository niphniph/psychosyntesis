import { useState, useEffect } from 'react';
import api from '../api';
import { EggDiagram } from '../components/EggDiagram';
import { SubpersonalityBuilder } from '../components/SubpersonalityBuilder';
import type { Subpersonality } from '../components/SubpersonalityBuilder';
import { SubpersonalityChart } from '../components/SubpersonalityChart';
import { Map, Users, FileText, History, Calendar, Clock } from 'lucide-react';

interface JournalEntry {
  id: string;
  section: string;
  content: string;
  createdAt: string;
}

interface MeditationLog {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
}

const SECTION_TRANSLATIONS: Record<string, string> = {
  'lower-unconscious': 'ქვედა ქვეცნობიერი',
  'middle-unconscious': 'საშუალო ქვეცნობიერი',
  'higher-unconscious': 'ზეცნობიერი',
  'field-of-consciousness': 'ცნობიერების ველი',
  'personal-self': 'პიროვნული "მე"',
  'higher-self': 'უმაღლესი "მე"'
};

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'subs' | 'journal' | 'history'>('map');
  const [subpersonalities, setSubpersonalities] = useState<Subpersonality[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [meditationLogs, setMeditationLogs] = useState<MeditationLog[]>([]);

  useEffect(() => {
    fetchJournal();
    fetchMeditationLogs();
  }, [activeTab]);

  const fetchJournal = async () => {
    try {
      const response = await api.get('/journal');
      if (response.data && Array.isArray(response.data)) setJournalEntries(response.data);
    } catch (err) {
      console.error('Error fetching journal:', err);
    }
  };

  const fetchMeditationLogs = async () => {
    try {
      const response = await api.get('/meditation-logs');
      if (response.data && Array.isArray(response.data)) setMeditationLogs(response.data);
    } catch (err) {
      console.error('Error fetching meditation logs:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-12">
      {/* Workspace Menu navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-3xl font-headline-lg text-surface-bright">პირადი სამუშაო სივრცე</h2>
          <p className="text-xs text-surface-variant/70 mt-1">
            მართეთ თქვენი ფსიქიკური რუკა, ქვეპიროვნებები და დღიურის ჩანაწერები.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 font-label-md px-4 py-2.5 rounded-xl border text-xs transition-all ${
              activeTab === 'map'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <Map size={14} />
            ფსიქიკის რუკა
          </button>
          <button
            onClick={() => setActiveTab('subs')}
            className={`flex items-center gap-2 font-label-md px-4 py-2.5 rounded-xl border text-xs transition-all ${
              activeTab === 'subs'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <Users size={14} />
            ქვეპიროვნებები
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 font-label-md px-4 py-2.5 rounded-xl border text-xs transition-all ${
              activeTab === 'journal'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <FileText size={14} />
            დღიურის ლოგი
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 font-label-md px-4 py-2.5 rounded-xl border text-xs transition-all ${
              activeTab === 'history'
                ? 'bg-tertiary-container text-primary-container border-tertiary-container'
                : 'bg-white/5 border-white/10 text-surface-variant hover:border-white/20'
            }`}
          >
            <History size={14} />
            მედიტაციის ისტორია
          </button>
        </div>
      </div>

      {/* Content areas */}
      <div>
        {activeTab === 'map' && (
          <div className="space-y-8 animate-fadeIn">
            <EggDiagram isAuthenticated={true} onEntrySaved={fetchJournal} />
          </div>
        )}

        {activeTab === 'subs' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Visual Chart */}
            <SubpersonalityChart data={subpersonalities} />

            {/* Builder Form and List */}
            <SubpersonalityBuilder onSubpersonalitiesChange={setSubpersonalities} />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
            <h3 className="text-xl font-headline-md text-surface-bright mb-4">
              თქვენი რეფლექსიების დღიური
            </h3>
            
            {journalEntries.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-[32px] p-12 text-center text-surface-variant/60">
                დღიურის ჩანაწერები ჯერ არ გაგიკეთებიათ.
                <p className="text-xs mt-1">
                  გადადით "ფსიქიკის რუკაზე", დააკლიკეთ რომელიმე ზონას და ჩაწერეთ თქვენი რეფლექსია.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {journalEntries.slice().reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-tertiary-container/30 transition-all"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-xs font-bold text-tertiary-container uppercase tracking-wider">
                        {SECTION_TRANSLATIONS[entry.section] || entry.section}
                      </span>
                      <span className="text-[10px] text-surface-variant/60 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-surface-variant leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
            <h3 className="text-xl font-headline-md text-surface-bright mb-4">
              ჩატარებული პრაქტიკები
            </h3>

            {meditationLogs.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-[32px] p-12 text-center text-surface-variant/60">
                ჩატარებული მედიტაციის სესიები ჯერ არ გაგივლიათ.
                <p className="text-xs mt-1">
                  გადადით "კურსები / პრაქტიკა" გვერდზე და დაუთმეთ დრო მედიტაციას.
                </p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-tertiary-container text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">მედიტაციის ტიპი</th>
                      <th className="p-4">ხანგრძლივობა</th>
                      <th className="p-4 pr-6">თარიღი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-surface-variant/90">
                    {meditationLogs.slice().reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 pl-6 font-bold text-surface-bright">{log.title}</td>
                        <td className="p-4 flex items-center gap-1.5">
                          <Clock size={12} className="text-tertiary-container" />
                          <span>{log.duration} წამი</span>
                        </td>
                        <td className="p-4 pr-6 text-xs">{formatDate(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
