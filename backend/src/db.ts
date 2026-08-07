import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

export interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  name: string;
  role?: 'admin' | 'user';
}

export interface Subpersonality {
  id: string;
  userId: string;
  name: string;
  role: string;
  traits: string[];
  needs: string[];
  influence: number; // 0 to 100
  createdAt: string;
}

export interface MeditationLog {
  id: string;
  userId: string;
  title: string;
  duration: number; // in seconds
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  section: string; // e.g. "lower-unconscious", "middle-unconscious", "higher-unconscious", "field-of-consciousness", "self", "higher-self"
  content: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: string;
  modules: string[];
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  type: string;
  year: string;
  description: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // e.g. "12 Oct" or "Oct 12"
  time: string; // e.g. "15:00"
  location: string;
  category: 'online' | 'onsite';
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'urgent' | 'read' | 'unread';
  createdAt: string;
}

export interface SeoSetting {
  path: string;
  title: string;
  description: string;
  keywords: string;
}

export interface SiteSettings {
  siteTitle: string;
  navHome: string;
  navAboutDropdown: string;
  navHistory: string;
  navFounder: string;
  navTrainers: string;
  navPsychosynthesisAbout: string;
  navProgramDropdown: string;
  navAcademic: string;
  navResources: string;
  navEvents: string;
  navPractice: string;
  navWorkspace: string;
  navContact: string;
  academicCoursesTab: string;
  academicLibraryTab: string;
  academicBlogsTab: string;
  academicTitle: string;
  academicSubtitle: string;
  eventsTitle: string;
  eventsSubtitle: string;
  practiceTitle: string;
  practiceSubtitle: string;
  founderTitle: string;
  founderSubtitle: string;
  historyText: string;
  founderBioText: string;
  trainersText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaButton: string;
  aboutTitle: string;
  aboutText: string;
  footerCopyright: string;
  footerContactEmail: string;
  footerContactPhone: string;
}

export const defaultSiteSettings: SiteSettings = {
  siteTitle: 'Georgian\nInstitute of\nPsychosynthesis',
  navHome: 'მთავარი',
  navAboutDropdown: 'ჩვენ შესახებ',
  navHistory: 'ინსტიტუტის ისტორია',
  navFounder: 'დამფუძნებელი',
  navTrainers: 'ტრენერები',
  navPsychosynthesisAbout: 'ფსიქოსინთეზის შესახებ',
  navProgramDropdown: 'სასწავლო პროგრამა',
  navAcademic: 'აკადემიური პორტალი',
  navResources: 'რესურსები',
  navEvents: 'ღონისძიებები',
  navPractice: 'მედიტაციის ოთახი',
  navWorkspace: 'სამუშაო სივრცე',
  navContact: 'კონტაქტი',
  academicCoursesTab: 'აკადემიური კურსები',
  academicLibraryTab: 'ბიბლიოთეკა',
  academicBlogsTab: 'ბლოგები და პუბლიკაციები',
  academicTitle: 'აკადემიური პორტალი',
  academicSubtitle: 'გაიღრმავეთ ცოდნა ფსიქოსინთეზის თეორიაში, გაეცანით კლასიკურ ნაშრომებსა და უახლეს სამეცნიერო პუბლიკაციებს.',
  eventsTitle: 'საჯარო აქტივობები & ღონისძიებები',
  eventsSubtitle: 'გაეცანით ჩვენს უახლოეს სემინარებს, ვორქშოფებსა და ინტენსიურ კურსებს.',
  practiceTitle: 'მედიტაციისა და თვითშემეცნების ოთახი',
  practiceSubtitle: 'შინაგანი მშვიდობის, დეიდენტიფიკაციისა და ცნობიერების ამაღლების პრაქტიკები.',
  founderTitle: 'რობერტო ასაჯიოლი & დამფუძნებლები',
  founderSubtitle: 'ფსიქოსინთეზის ფუძემდებლის ცხოვრება, ფილოსოფია და ინსტიტუტის აკადემიური გუნდი.',
  historyText: 'ფსიქოსინთეზის ქართული ინსტიტუტი დაარსდა მეცნიერული და თერაპიული კვლევების ბაზაზე. ინსტიტუტის მიზანია რობერტო ასაჯიოლის ინტეგრალური ფსიქოლოგიის პრინციპების დანერგვა და პიროვნული ტრანსფორმაციის ხელშეწყობა.',
  founderBioText: 'დოქტორი ელენე კვანტალიანი არის ინსტიტუტის დამფუძნებელი და წამყვანი ფსიქოთერაპევტი, რომელსაც აქვს 20-წლიანი გამოცდილება ინტეგრალურ ფსიქოლოგიასა და ფსიქოსინთეზის პრაქტიკაში.',
  trainersText: 'ჩვენი აკადემიური გუნდი შედგება სერტიფიცირებული ფსიქოლოგების, თერაპევტებისა და ტრენერებისგან, რომლებიც ატარებენ ინტენსიურ კურსებსა და ინდივიდუალურ კონსულტაციებს.',
  heroTitle: 'ინტეგრალური ფსიქოლოგია & პიროვნული ტრანსფორმაცია',
  heroSubtitle: 'საქართველოს ფსიქოსინთეზის ინსტიტუტი - მეცნიერება შინაგანი მთლიანობისა და სულიერი ზრდის შესახებ.',
  heroCtaButton: 'პროგრამების დათვალიერება',
  aboutTitle: 'ინსტიტუტის შესახებ',
  aboutText: 'ქართული ფსიქოსინთეზის ინსტიტუტი არის წამყვანი აკადემიური და თერაპიული ცენტრი საქართველოში, რომელიც ეფუძნება რობერტო ასაჯიოლის ნაშრომებს.',
  footerCopyright: '© 2026 ფსიქოსინთეზის ქართული ინსტიტუტი. ყველა უფლება დაცულია.',
  footerContactEmail: 'info@psychosynthesis.ge',
  footerContactPhone: '+995 32 2 100 200'
};

export interface DatabaseSchema {
  users: User[];
  subpersonalities: Subpersonality[];
  meditationLogs: MeditationLog[];
  journalEntries: JournalEntry[];
  courses: Course[];
  resources: LibraryResource[];
  blogs: Blog[];
  registrations: Registration[];
  events: Event[];
  inquiries: Inquiry[];
  seoSettings: SeoSetting[];
  siteSettings: SiteSettings;
}

// Default initial data to seed database
const seedCourses: Course[] = [
  {
    id: 'course-1',
    title: 'ფსიქოსინთეზის საფუძვლები (Level 1)',
    description: 'რობერტო ასაჯიოლის თეორიული ჩარჩოს საფუძვლიანი შესწავლა. კურსი მოიცავს ფსიქიკის სტრუქტურის, კვერცხის დეაგრამისა და ძირითადი ფუნქციების ანალიზს.',
    duration: '8 კვირა',
    category: 'აკადემიური',
    difficulty: 'დამწყები',
    modules: ['შესავალი ფსიქოსინთეზში', 'ფსიქიკის ტოპოგრაფია', 'ნების ფენომენოლოგია', 'პრაქტიკული სავარჯიშოები']
  },
  {
    id: 'course-2',
    title: 'ქვეპიროვნებებთან მუშაობის ხელოვნება',
    description: 'პრაქტიკული კურსი, რომელიც ორიენტირებულია შინაგანი ქვეპიროვნებების (Subpersonalities) იდენტიფიცირებაზე, მათ ჰარმონიზაციასა და ცენტრალური ნების გარშემო ინტეგრაციაზე.',
    duration: '6 კვირა',
    category: 'პრაქტიკული',
    difficulty: 'საშუალო',
    modules: ['ქვეპიროვნებების აღმოჩენა', 'დეიდენტიფიკაციის ტექნიკა', 'შინაგანი დიალოგი', 'ინტეგრაცია']
  },
  {
    id: 'course-3',
    title: 'ტრანსპერსონალური ფსიქოსინთეზი',
    description: 'უმაღლესი "მე"-ს (Higher Self) კვლევა, სულიერი კრიზისების მართვა და ტრანსპერსონალური გამოცდილებების ინტეგრაცია ყოველდღიურ ცხოვრებაში.',
    duration: '10 კვირა',
    category: 'აკადემიური',
    difficulty: 'პროფესიონალი',
    modules: ['უმაღლესი ქვეცნობიერი', 'სულიერი კრიზისები', 'თვითრეალიზაციის გზა', 'კოსმიური ცნობიერება']
  }
];

const seedResources: LibraryResource[] = [
  {
    id: 'lib-1',
    title: 'ფსიქოსინთეზი: სახელმძღვანელო პრინციპები და ტექნიკები',
    author: 'რობერტო ასაჯიოლი',
    type: 'წიგნი',
    year: '1965',
    description: 'ფუნდამენტური ნაშრომი, სადაც ავტორი დეტალურად აღწერს ფსიქოსინთეზის თეორიასა და პრაქტიკულ სავარჯიშოებს.'
  },
  {
    id: 'lib-2',
    title: 'ნების აქტიურობა',
    author: 'რობერტო ასაჯიოლი',
    type: 'წიგნი',
    year: '1973',
    description: 'ნაშრომი ეძღვნება ნებისყოფის კვლევას, მის განზომილებებს (ძლიერი, კეთილი, ბრძენი, ტრანსპერსონალური) და მათ განვითარებას.'
  },
  {
    id: 'lib-3',
    title: 'დეიდენტიფიკაციის ვარჯიში და მისი თერაპიული ეფექტი',
    author: 'ინსტიტუტის კვლევითი ჯგუფი',
    type: 'სტატია',
    year: '2022',
    description: 'აკადემიური კვლევა ყოველდღიური დეიდენტიფიკაციის გავლენაზე შფოთვისა და ემოციური რეგულაციის ხარისხზე.'
  }
];

const seedBlogs: Blog[] = [
  {
    id: 'blog-1',
    title: 'ფსიქოსინთეზი და კოლექტიური ცნობიერება',
    content: 'ჩვენი ინდივიდუალური ფსიქიკა არ არის იზოლირებული კუნძული. ასაჯიოლის კვერცხის დიაგრამის გარშემო არსებული შტრიხები მიუთითებს მის განუყოფელ კავშირზე კოლექტიურ ქვეცნობიერთან. ამ სტატიაში განვიხილავთ, თუ როგორ ზემოქმედებს საზოგადოებრივი არქეტიპები ინდივიდუალურ ქვეპიროვნებებზე.',
    author: 'მარიამ ნ.',
    createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: 'blog-2',
    title: 'ნებისყოფის განვითარების პრაქტიკული გზები',
    content: 'ადამიანების უმეტესობა ნებას ასოცირებს ძალადობასთან ან აკრძალვებთან. თუმცა ფსიქოსინთეზში ნება არის კეთილი, ბრძენი და ინტეგრირებული. სტატიაში აღწერილია ყოველდღიური მცირე ვარჯიშები, რომლებიც გვეხმარება ნებისყოფის გაძლიერებაში.',
    author: 'გიორგი კ.',
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
];

const seedEvents: Event[] = [
  {
    id: 'event-1',
    title: 'ღია კარის დღე',
    date: '12 ოქტ',
    time: '15:00',
    location: 'აუდიტორია 4',
    category: 'onsite'
  },
  {
    id: 'event-2',
    title: 'სემინარი: ეგო და სული',
    date: '15 ოქტ',
    time: '11:00',
    location: 'ონლაინ (Zoom)',
    category: 'online'
  }
];

const seedInquiries: Inquiry[] = [
  {
    id: 'inq-1',
    name: 'ლაშა კ.',
    email: 'lasha@gmail.com',
    message: 'აკრედიტაციასთან დაკავშირებით მაქვს შეკითხვა. გადის თუ არა თქვენი სერტიფიკატები საერთაშორისო ასოციაციის შემოწმებას?',
    status: 'urgent',
    createdAt: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
  },
  {
    id: 'inq-2',
    name: 'ნინო დვალი',
    email: 'nino@gmail.com',
    message: 'გამარჯობა, მაინტერესებს როდის იწყება შემდეგი კურსი ქვეპიროვნებების ჰარმონიზაციაზე და არის თუ არა ფასდაკლება სტუდენტებისთვის?',
    status: 'unread',
    createdAt: new Date(Date.now() - 28800000).toISOString() // 8 hours ago
  }
];

const seedSeo: SeoSetting[] = [
  {
    path: '/',
    title: 'ფსიქოსინთეზის ინსტიტუტი - მთავარი',
    description: 'აკადემიური სივრცე თვითშემეცნებისა და სულიერი ზრდისთვის.',
    keywords: 'ფსიქოსინთეზი, ასაჯიოლი, კვერცხის დიაგრამა, მედიტაცია'
  }
];

const initialDb: DatabaseSchema = {
  users: [],
  subpersonalities: [],
  meditationLogs: [],
  journalEntries: [],
  courses: seedCourses,
  resources: seedResources,
  blogs: seedBlogs,
  registrations: [],
  events: seedEvents,
  inquiries: seedInquiries,
  seoSettings: seedSeo,
  siteSettings: defaultSiteSettings
};

export class Database {
  private static async ensureDir() {
    const dir = path.dirname(DB_PATH);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  public static async read(): Promise<DatabaseSchema> {
    await this.ensureDir();
    try {
      const content = await fs.readFile(DB_PATH, 'utf-8');
      const data = JSON.parse(content) as DatabaseSchema;
      
      // Upgrade database schema dynamically if older keys are missing
      let upgraded = false;
      const keys = ['users', 'subpersonalities', 'meditationLogs', 'journalEntries', 'courses', 'resources', 'blogs', 'registrations', 'events', 'inquiries', 'seoSettings', 'siteSettings'] as const;
      for (const key of keys) {
        if (!data[key]) {
          (data as any)[key] = initialDb[key] || [];
          upgraded = true;
        }
      }
      if (upgraded) {
        await this.write(data);
      }
      
      return data;
    } catch (error) {
      // If file doesn't exist, write the initial db schema and return it
      await this.write(initialDb);
      return initialDb;
    }
  }

  public static async write(data: DatabaseSchema): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }
}
