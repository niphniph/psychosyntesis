import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
export const defaultSiteSettings = {
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
// Default initial data to seed database
const seedCourses = [
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
const seedResources = [
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
const seedBlogs = [
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
const seedEvents = [
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
const seedInquiries = [
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
const seedPosts = [
    {
        id: 'post-1',
        title: 'ფსიქოსინთეზი და პიროვნული ტრანსფორმაცია',
        slug: 'understanding-psychosynthesis',
        shortDescription: 'რობერტო ასაჯიოლის მოძღვრება ადამიანის შინაგანი მთლიანობისა და თვითრეალიზაციის შესახებ.',
        content: '<h2>ფსიქოსინთეზის არსი</h2><p>ფსიქოსინთეზი არის ინტეგრალური ფსიქოლოგიური სისტემა, რომელიც შეიმუშავა იტალიელმა ფსიქიატრმა რობერტო ასაჯიოლიმ. იგი აერთიანებს მეცნიერულ დაკვირვებასა და სულიერ გამოცდილებას.</p><h3>ძირითადი პრინციპები</h3><ul><li>დეიდენტიფიკაცია და ცენტრალური "მე"</li><li>ქვეპიროვნებების იდენტიფიცირება და ჰარმონიზაცია</li><li>ნებისყოფის განვითარება</li></ul>',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNDeZZ08mYF6XPWzNvdpcdgGEZZEInkt1LJcyj21WLrUU6cPTULdQOoPi0QycgMzwUodPdoV-G5I96r5z8j983ajKS97dUxzC6c9ncp9ffKmxvG0175l5YgQlHWM0_RPU2ZELQoy3Q_9wf9X583ADmHTMjq9oZ6_lSHZSpOrePAmrGxW3IS2x23xJchjTHbTWmOw-r6IHbK5pHOXOwLMCDX_1TUZo7dQ9RycL-PX_vQvY_1FsjF_4B',
        category: 'თეორია',
        tags: ['Assagioli', 'Psychosynthesis', 'Personal Growth'],
        author: 'Dr. Elene Kvantaliani',
        publishDate: new Date().toISOString(),
        status: 'published',
        featured: true,
        visibility: 'public',
        displayLocations: ['homepage_featured', 'articles'],
        seoTitle: 'ფსიქოსინთეზი და პიროვნული ტრანსფორმაცია - სტატია',
        seoDescription: 'გაეცანით რობერტო ასაჯიოლის ფსიქოსინთეზის ძირითად თეორიულ პრინციპებს.',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'post-2',
        title: 'ქვეპიროვნებების დეიდენტიფიკაციის ხელოვნება',
        slug: 'subpersonalities-deidentification',
        shortDescription: 'როგორ გავთავისუფლდეთ ემოციური ავტომატიზმებისგან და ვიპოვოთ შინაგანი დამკვირვებელი.',
        content: '<h2>რა არის დეიდენტიფიკაცია?</h2><p>დეიდენტიფიკაციის პრინციპი ეფუძნება ფორმულას: <em>"მე მაქვს ემოციები, მაგრამ მე არ ვარ ჩემი ემოცია. მე მაქვს სხეული, მაგრამ მე არ ვარ ჩემი სხეული."</em></p>',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwP6hC4cxO4ChS9CSBg6rFMaXtZiezNQK8cTyXYEBsf2SyQJNzZyjd5gl-qU1yztscnaaHtFvz-uQPOhweDhZ63p3qOIaNIe0wTJ_pQA_5MOEv7r6netKM8I_KMiuNY9-3a1GI4tpy60fReYV5xIdgFkwcbTpw5LfViehgfENmnKtuswBNu6ds7FZQdNBIe3ws4flqeMIpxRjGD6_XJmlQzuvCnEuuGyMswDvhb_mX-tYkNRXgutjL',
        category: 'პრაქტიკა',
        tags: ['Deidentification', 'Self'],
        author: 'Dr. K. Abashidze',
        publishDate: new Date().toISOString(),
        status: 'published',
        featured: true,
        visibility: 'public',
        displayLocations: ['homepage_latest', 'articles', 'resources'],
        seoTitle: 'ქვეპიროვნებების დეიდენტიფიკაცია',
        seoDescription: 'პრაქტიკული გზამკვლევი შინაგანი დამკვირვებლის აღმოსაჩენად.',
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
const seedPages = [
    {
        id: 'page-resources',
        title: 'ფსიქოსინთეზის რესურსები',
        slug: 'resources',
        content: '<h2>აკადემიური და პრაქტიკული რესურსები</h2><p>აქ იხილავთ ფსიქოსინთეზის ქართული ინსტიტუტის მიერ მომზადებულ მასალებს, წიგნებსა და კვლევებს.</p>',
        heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADlkkmgIHMdESPqFQWxN-qaJEefgYUcgPDfTfY6I1ULMeo84qhptW_vG8srsDba5wWxCfUXPHYdQZ1lN4XWDMwl93ZAn-mAnCpanna14_g6DJlEf6ak8iE3HJ7krX-6TGD8Gvze5xjGnG8CxTFdppVDqN8qjIeuVERCiT2pzIRa_6TaYBvltqryMiCivqjDUR-UGzSuI8u5D7-RLqnNZ8ozDWH2S_-SJ0fOwoiWoflJgtbPFClyFP6',
        seoTitle: 'რესურსები - ფსიქოსინთეზის ინსტიტუტი',
        seoDescription: 'ფსიქოსინთეზის წიგნები, სტატიები და ელექტრონული ბიბლიოთეკა.',
        status: 'published',
        navVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
const seedHomepageSections = [
    {
        id: 'sec-hero',
        sectionKey: 'hero',
        title: 'სულის მთლიანობისა და პიროვნული ჰარმონიის გზა',
        subtitle: 'ფსიქოსინთეზის ქართული ინსტიტუტი გიწვევთ თვითშემეცნების სიღრმეებში, სადაც აკადემიური ცოდნა და სულიერი პრაქტიკა ერთიანდება.',
        ctaText: 'დაიწყე მოგზაურობა',
        ctaLink: '/workspace',
        bgImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADlkkmgIHMdESPqFQWxN-qaJEefgYUcgPDfTfY6I1ULMeo84qhptW_vG8srsDba5wWxCfUXPHYdQZ1lN4XWDMwl93ZAn-mAnCpanna14_g6DJlEf6ak8iE3HJ7krX-6TGD8Gvze5xjGnG8CxTFdppVDqN8qjIeuVERCiT2pzIRa_6TaYBvltqryMiCivqjDUR-UGzSuI8u5D7-RLqnNZ8ozDWH2S_-SJ0fOwoiWoflJgtbPFClyFP6',
        isVisible: true,
        sortOrder: 1
    },
    {
        id: 'sec-intro',
        sectionKey: 'intro',
        title: 'რა არის ფსიქოსინთეზი?',
        subtitle: 'ფილოსოფია & ისტორია',
        content: 'ფსიქოსინთეზი არის ფსიქოლოგიის ჰუმანისტური და ტრანსპერსონალური მიმართულება, რომელიც დააფუძნა რობერტო ასაჯიოლიმ. ეს არის მიდგომა, რომელიც ადამიანს განიხილავს როგორც ერთიან მთლიანობას — სხეულის, გრძნობების, გონებისა და სულის სინთეზს.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNDeZZ08mYF6XPWzNvdpcdgGEZZEInkt1LJcyj21WLrUU6cPTULdQOoPi0QycgMzwUodPdoV-G5I96r5z8j983ajKS97dUxzC6c9ncp9ffKmxvG0175l5YgQlHWM0_RPU2ZELQoy3Q_9wf9X583ADmHTMjq9oZ6_lSHZSpOrePAmrGxW3IS2x23xJchjTHbTWmOw-r6IHbK5pHOXOwLMCDX_1TUZo7dQ9RycL-PX_vQvY_1FsjF_4B',
        isVisible: true,
        sortOrder: 2
    },
    {
        id: 'sec-featured',
        sectionKey: 'featured_content',
        title: 'ჩვენი მიმართულებები',
        subtitle: 'აკადემიური და პრაქტიკული სექციები',
        isVisible: true,
        sortOrder: 3
    },
    {
        id: 'sec-articles',
        sectionKey: 'latest_articles',
        title: 'უახლესი პუბლიკაციები',
        subtitle: 'სტატიები და გამოკვლევები',
        isVisible: true,
        sortOrder: 4
    },
    {
        id: 'sec-cta',
        sectionKey: 'cta',
        title: 'მზად ხართ ტრანსფორმაციისთვის?',
        subtitle: 'შემოუერთდით ჩვენს საზოგადოებას და დაიწყეთ მოგზაურობა სულიერი და ინტელექტუალური სიმწიფისკენ.',
        ctaText: 'ღია კარის დღეზე ჩაწერა',
        ctaLink: '/events',
        isVisible: true,
        sortOrder: 5
    }
];
const seedNavigationItems = [
    { id: 'nav-1', label: 'მთავარი', url: '/', isExternal: false, isVisible: true, sortOrder: 1 },
    { id: 'nav-2', label: 'ჩვენ შესახებ', url: '/#about-philosophy', isExternal: false, isVisible: true, sortOrder: 2 },
    { id: 'nav-2a', label: 'ინსტიტუტის ისტორია', url: '/#about-philosophy', isExternal: false, isVisible: true, sortOrder: 1, parentId: 'nav-2' },
    { id: 'nav-2b', label: 'დამფუძნებელი', url: '/founder', isExternal: false, isVisible: true, sortOrder: 2, parentId: 'nav-2' },
    { id: 'nav-3', label: 'ფსიქოსინთეზის შესახებ', url: '/#about-philosophy', isExternal: false, isVisible: true, sortOrder: 3 },
    { id: 'nav-4', label: 'აკადემიური პორტალი', url: '/academic', isExternal: false, isVisible: true, sortOrder: 4 },
    { id: 'nav-5', label: 'რესურსები', url: '/resources', isExternal: false, isVisible: true, sortOrder: 5 },
    { id: 'nav-6', label: 'ღონისძიებები', url: '/events', isExternal: false, isVisible: true, sortOrder: 6 }
];
const seedActivityLog = [
    {
        id: 'act-1',
        action: 'System initialized',
        entityType: 'System',
        details: 'CMS database structure ready and initial content seeded',
        timestamp: new Date().toISOString()
    }
];
const seedSeo = [
    {
        path: '/',
        title: 'ფსიქოსინთეზის ინსტიტუტი - მთავარი',
        description: 'აკადემიური სივრცე თვითშემეცნებისა და სულიერი ზრდისთვის.',
        keywords: 'ფსიქოსინთეზი, ასაჯიოლი, კვერცხის დიაგრამა, მედიტაცია'
    }
];
const initialDb = {
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
    siteSettings: defaultSiteSettings,
    posts: seedPosts,
    pages: seedPages,
    homepageSections: seedHomepageSections,
    navigationItems: seedNavigationItems,
    media: [],
    activityLog: seedActivityLog,
    adminSessions: []
};
export class Database {
    static async ensureDir() {
        const dir = path.dirname(DB_PATH);
        try {
            await fs.access(dir);
        }
        catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    static async read() {
        await this.ensureDir();
        try {
            const content = await fs.readFile(DB_PATH, 'utf-8');
            const data = JSON.parse(content);
            // Upgrade database schema dynamically if older keys are missing
            let upgraded = false;
            const keys = [
                'users', 'subpersonalities', 'meditationLogs', 'journalEntries',
                'courses', 'resources', 'blogs', 'registrations', 'events',
                'inquiries', 'seoSettings', 'siteSettings', 'posts', 'pages',
                'homepageSections', 'navigationItems', 'media', 'activityLog', 'adminSessions'
            ];
            for (const key of keys) {
                if (!data[key]) {
                    data[key] = initialDb[key] || [];
                    upgraded = true;
                }
            }
            if (upgraded) {
                await this.write(data);
            }
            return data;
        }
        catch (error) {
            // If file doesn't exist, write the initial db schema and return it
            await this.write(initialDb);
            return initialDb;
        }
    }
    static async write(data) {
        await this.ensureDir();
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
}
