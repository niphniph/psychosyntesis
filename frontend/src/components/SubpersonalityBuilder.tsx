import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Sliders, Shield } from 'lucide-react';

export interface Subpersonality {
  id: string;
  name: string;
  role: string;
  traits: string[];
  needs: string[];
  influence: number;
}

interface SubpersonalityBuilderProps {
  onSubpersonalitiesChange?: (subs: Subpersonality[]) => void;
}

export const SubpersonalityBuilder: React.FC<SubpersonalityBuilderProps> = ({ onSubpersonalitiesChange }) => {
  const [subpersonalities, setSubpersonalities] = useState<Subpersonality[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [traits, setTraits] = useState('');
  const [needs, setNeeds] = useState('');
  const [influence, setInfluence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active disidentification subpersonality focus
  const [disidentifyingSub, setDisidentifyingSub] = useState<Subpersonality | null>(null);

  useEffect(() => {
    fetchSubpersonalities();
  }, []);

  const fetchSubpersonalities = async () => {
    try {
      const response = await api.get('/subpersonalities');
      if (response.data && Array.isArray(response.data)) {
        setSubpersonalities(response.data);
        if (onSubpersonalitiesChange) {
          onSubpersonalitiesChange(response.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching subpersonalities:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) {
      setError('სახელი და როლი აუცილებელია');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const traitsArray = traits.split(',').map((t) => t.trim()).filter(Boolean);
    const needsArray = needs.split(',').map((n) => n.trim()).filter(Boolean);

    try {
      const response = await api.post('/subpersonalities', {
        name,
        role,
        traits: traitsArray,
        needs: needsArray,
        influence,
      });

      setSuccess('ქვეპიროვნება წარმატებით დაემატა!');
      setName('');
      setRole('');
      setTraits('');
      setNeeds('');
      setInfluence(50);
      
      const updatedList = [...subpersonalities, response.data];
      setSubpersonalities(updatedList);
      if (onSubpersonalitiesChange) {
        onSubpersonalitiesChange(updatedList);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ქვეპიროვნების დამატებისას დაფიქსირდა შეცდომა');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInfluenceChange = async (id: string, newInfluence: number) => {
    // Optimistic UI update
    const updated = subpersonalities.map((sub) =>
      sub.id === id ? { ...sub, influence: newInfluence } : sub
    );
    setSubpersonalities(updated);

    try {
      await api.put(`/subpersonalities/${id}`, { influence: newInfluence });
      if (onSubpersonalitiesChange) {
        onSubpersonalitiesChange(updated);
      }
    } catch (err) {
      console.error('Error updating influence:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ წაშალოთ ეს ქვეპიროვნება?')) return;

    try {
      await api.delete(`/subpersonalities/${id}`);
      const updated = subpersonalities.filter((sub) => sub.id !== id);
      setSubpersonalities(updated);
      if (onSubpersonalitiesChange) {
        onSubpersonalitiesChange(updated);
      }
      if (disidentifyingSub?.id === id) {
        setDisidentifyingSub(null);
      }
    } catch (err) {
      console.error('Error deleting subpersonality:', err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
          <div>
            <h3 className="text-xl font-headline-md text-tertiary-container">
              ქვეპიროვნების დამატება
            </h3>
            <p className="text-xs text-surface-variant/60 mt-1">
              აღწერეთ თქვენი შინაგანი ხმა, როლი ან ნაწილი (მაგ: დამცველი, კრიტიკოსი)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-label-md text-tertiary-container mb-1">
                ქვეპიროვნების სახელი
              </label>
              <input
                type="text"
                className="w-full bg-primary-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-surface-bright focus:ring-1 focus:ring-tertiary-container focus:outline-none"
                placeholder="მაგ: შინაგანი პერფექციონისტი"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-label-md text-tertiary-container mb-1">
                როლი (რას აკეთებს თქვენს ცხოვრებაში?)
              </label>
              <input
                type="text"
                className="w-full bg-primary-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-surface-bright focus:ring-1 focus:ring-tertiary-container focus:outline-none"
                placeholder="მაგ: მიცავს კრიტიკისა და მარცხისგან"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-label-md text-tertiary-container mb-1">
                თვისებები (მძიმით გამოყოფილი)
              </label>
              <input
                type="text"
                className="w-full bg-primary-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-surface-bright focus:ring-1 focus:ring-tertiary-container focus:outline-none"
                placeholder="მაგ: მომთხოვნი, დაძაბული, ორგანიზებული"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-label-md text-tertiary-container mb-1">
                მოთხოვნილებები (მძიმით გამოყოფილი)
              </label>
              <input
                type="text"
                className="w-full bg-primary-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-surface-bright focus:ring-1 focus:ring-tertiary-container focus:outline-none"
                placeholder="მაგ: უსაფრთხოება, აღიარება, სიმშვიდე"
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-label-md text-tertiary-container">
                  აქტიურობა/გავლენა (1 - 100)
                </label>
                <span className="text-xs text-tertiary-container font-bold">{influence}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                className="w-full accent-tertiary-container"
                value={influence}
                onChange={(e) => setInfluence(Number(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-tertiary-container text-primary-container font-label-md py-3 rounded-xl hover:bg-tertiary-fixed transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {isSubmitting ? 'ემატება...' : 'დამატება'}
            </button>

            {error && <p className="text-xs text-error text-center font-bold">{error}</p>}
            {success && <p className="text-xs text-secondary-fixed text-center font-bold">{success}</p>}
          </form>
        </div>

        {/* List of Subpersonalities */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-headline-md text-surface-bright">
              თქვენი ქვეპიროვნებები ({subpersonalities.length})
            </h3>
            <p className="text-xs text-surface-variant/60">
              დაარეგულირეთ მათი დღევანდელი გავლენა სლაიდერით
            </p>
          </div>

          {subpersonalities.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-[32px] p-12 text-center text-surface-variant/60 flex flex-col items-center">
              <Sliders size={32} className="text-tertiary-container/30 mb-3" />
              <p className="text-sm">დამატებული ქვეპიროვნებები არ არის.</p>
              <p className="text-xs mt-1">
                გამოიყენეთ მარცხენა ფორმა პირველი ქვეპიროვნების შესაქმნელად.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subpersonalities.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-tertiary-container/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-surface-bright text-lg">{sub.name}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDisidentifyingSub(sub)}
                          title="დეიდენტიფიკაცია"
                          className="p-1.5 rounded-lg bg-tertiary-container/10 text-tertiary-container hover:bg-tertiary-container/20 transition-all"
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 rounded-lg bg-error-container/10 text-error hover:bg-error-container/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-surface-variant/80 italic">
                      <strong>როლი:</strong> {sub.role}
                    </p>

                    {sub.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-tertiary-container font-semibold uppercase mr-1">
                          თვისებები:
                        </span>
                        {sub.traits.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] text-surface-variant"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {sub.needs.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-tertiary-container font-semibold uppercase mr-1">
                          საჭიროება:
                        </span>
                        {sub.needs.map((n, idx) => (
                          <span
                            key={idx}
                            className="bg-tertiary-container/5 border border-tertiary-container/10 px-2 py-0.5 rounded-md text-[10px] text-tertiary-container"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-xs text-surface-variant/85">
                      <span>დღევანდელი გავლენა:</span>
                      <span className="font-bold text-tertiary-container">{sub.influence}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      className="w-full accent-tertiary-container"
                      value={sub.influence}
                      onChange={(e) => handleInfluenceChange(sub.id, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disidentification Modal/Box */}
      {disidentifyingSub && (
        <div className="bg-primary/40 border border-tertiary-container/20 rounded-[32px] p-8 mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-container/5 rounded-bl-[100px] flex items-center justify-center">
            <Shield className="text-tertiary-container/30" size={32} />
          </div>
          
          <div className="max-w-2xl space-y-6">
            <div>
              <span className="text-xs uppercase font-label-md text-tertiary-container tracking-widest block mb-1">
                აქტიური დეიდენტიფიკაცია
              </span>
              <h4 className="text-2xl font-headline-md text-surface-bright">
                გათავისუფლდით "{disidentifyingSub.name}"-ის დომინირებისგან
              </h4>
            </div>

            <p className="text-surface-variant leading-relaxed">
              ფსიქოსინთეზში დეიდენტიფიკაცია ნიშნავს იმის აღიარებას, რომ თქვენს შიგნით არის გარკვეული ნაწილი, მაგრამ ის არ წარმოადგენს თქვენს სრულ მე-ს. თქვენ გაქვთ ეს ნაწილი, მაგრამ თქვენ ბევრად მეტი ხართ, ვიდრე ეს კონკრეტული როლი.
            </p>

            <div className="bg-[#0f3b2e] border border-white/5 rounded-2xl p-6 space-y-4">
              <p className="text-lg italic font-quote-editorial text-tertiary-fixed text-center leading-relaxed">
                "მე მაქვს ჩემი ქვეპიროვნება - <strong className="text-surface-bright not-italic underline decoration-tertiary-container">{disidentifyingSub.name}</strong>. მე ვაღიარებ მის როლს, რომელიც არის: <em>'{disidentifyingSub.role}'</em>. თუმცა, მე არ ვარ მხოლოდ ეს ნაწილი. მე ვარ ცენტრალური დამკვირვებელი, ცნობიერება და ნება, რომელიც სიყვარულით მართავს მას."
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setDisidentifyingSub(null)}
                className="bg-tertiary-container text-primary-container font-label-md px-6 py-2.5 rounded-xl hover:bg-tertiary-fixed transition-all"
              >
                მესმის და ვაცნობიერებ
              </button>
              <button
                onClick={() => setDisidentifyingSub(null)}
                className="text-surface-variant hover:text-surface-bright font-label-md px-6 py-2.5 rounded-xl transition-all"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
