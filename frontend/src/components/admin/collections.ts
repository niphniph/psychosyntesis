import type { CollectionField } from './CollectionManager';

interface CollectionConfig {
  endpoint: string;
  title: string;
  subtitle: string;
  itemLabel: string;
  fields: CollectionField[];
  listColumns: string[];
  defaults?: Record<string, any>;
}

export const COLLECTIONS: Record<'courses' | 'resources' | 'blogs' | 'events', CollectionConfig> = {
  courses: {
    endpoint: 'courses',
    title: 'აკადემიური კურსები',
    subtitle: 'კურსები, რომლებიც ჩანს აკადემიური პორტალის „კურსების“ ჩანართში',
    itemLabel: 'კურსი',
    listColumns: ['title', 'difficulty', 'duration', 'category'],
    defaults: { duration: '8 კვირა', category: 'აკადემიური', difficulty: 'დამწყები', modules: [] },
    fields: [
      { key: 'title', label: 'სათაური', type: 'text', required: true, wide: true },
      { key: 'description', label: 'აღწერა', type: 'textarea' },
      { key: 'duration', label: 'ხანგრძლივობა', type: 'text', placeholder: '8 კვირა' },
      { key: 'difficulty', label: 'დონე', type: 'text', placeholder: 'დამწყები / საშუალო / პროფესიონალი' },
      { key: 'category', label: 'კატეგორია', type: 'text' },
      { key: 'price', label: 'ფასი', type: 'text', placeholder: 'მაგ: 450 ₾' },
      { key: 'modules', label: 'მოდულები', type: 'list' },
      { key: 'imageUrl', label: 'სურათი', type: 'image' }
    ]
  },
  resources: {
    endpoint: 'resources',
    title: 'ბიბლიოთეკა',
    subtitle: 'წიგნები, სტატიები და მასალები აკადემიური პორტალის „ბიბლიოთეკაში“',
    itemLabel: 'რესურსი',
    listColumns: ['title', 'author', 'type', 'year'],
    defaults: { type: 'წიგნი', year: String(new Date().getFullYear()) },
    fields: [
      { key: 'title', label: 'სათაური', type: 'text', required: true, wide: true },
      { key: 'author', label: 'ავტორი', type: 'text' },
      { key: 'type', label: 'ტიპი', type: 'text', placeholder: 'წიგნი / სტატია / ვიდეო' },
      { key: 'year', label: 'წელი', type: 'text' },
      { key: 'description', label: 'აღწერა', type: 'textarea' },
      { key: 'fileUrl', label: 'ჩამოსატვირთი ფაილი (PDF) ან ბმული', type: 'file', help: 'თუ ცარიელია, ჩამოტვირთვის ღილაკი არ გამოჩნდება' },
      { key: 'imageUrl', label: 'გარეკანი', type: 'image' }
    ]
  },
  blogs: {
    endpoint: 'blogs',
    title: 'ბლოგები და პუბლიკაციები',
    subtitle: 'პორტალის „ბლოგების“ ჩანართის სტატიები',
    itemLabel: 'ბლოგი',
    listColumns: ['title', 'author', 'createdAt'],
    defaults: { author: 'ინსტიტუტი' },
    fields: [
      { key: 'title', label: 'სათაური', type: 'text', required: true, wide: true },
      { key: 'author', label: 'ავტორი', type: 'text' },
      { key: 'imageUrl', label: 'მთავარი სურათი', type: 'image' },
      { key: 'content', label: 'ტექსტი', type: 'richtext' }
    ]
  },
  events: {
    endpoint: 'events',
    title: 'ღონისძიებები',
    subtitle: 'ღონისძიებების გვერდის ბარათები და კალენდარი',
    itemLabel: 'ღონისძიება',
    listColumns: ['title', 'date', 'location', 'price', 'featured'],
    defaults: { category: 'onsite', location: 'ინსტიტუტის დარბაზი' },
    fields: [
      { key: 'title', label: 'სათაური', type: 'text', required: true, wide: true },
      { key: 'badge', label: 'იარლიყი', type: 'text', placeholder: 'სემინარი / ვორქშოფი / ვებინარი' },
      { key: 'category', label: 'ფორმატი', type: 'select', options: [{ value: 'onsite', label: 'ადგილზე' }, { value: 'online', label: 'ონლაინ' }] },
      { key: 'date', label: 'თარიღი (საჩვენებელი ტექსტი)', type: 'text', placeholder: '15 - 17 ნოემბერი' },
      { key: 'isoDate', label: 'თარიღი კალენდრისთვის', type: 'date', help: 'ამ თარიღზე მოინიშნება კალენდარში' },
      { key: 'time', label: 'დრო', type: 'text', placeholder: '15:00' },
      { key: 'location', label: 'ადგილი', type: 'text' },
      { key: 'price', label: 'ფასი', type: 'text', placeholder: '250 ₾' },
      { key: 'trainer', label: 'ტრენერი', type: 'text' },
      { key: 'ctaText', label: 'ღილაკის ტექსტი', type: 'text', placeholder: 'რეგისტრაცია' },
      { key: 'ctaLink', label: 'ღილაკის ბმული (არასავალდებულო)', type: 'text', placeholder: 'https://forms... ან /page-slug' },
      { key: 'featured', label: 'მთავარი (დიდი) ბარათი', type: 'checkbox', placeholder: 'გამოჩნდეს დიდ ბარათად' },
      { key: 'description', label: 'აღწერა', type: 'textarea' },
      { key: 'imageUrl', label: 'სურათი', type: 'image' }
    ]
  }
};
