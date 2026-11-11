// Every editable text / image of the public site that is not part of a collection
// (posts, pages, courses, events...). Values are stored in siteSettings on the backend;
// the defaults below are used until an admin saves a value.

export type ContentFieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'lines' | 'images' | 'link';

export interface ContentField {
  key: string;
  label: string;
  type: ContentFieldType;
  default: string;
  help?: string;
}

export interface ContentGroup {
  id: string;
  label: string;
  description: string;
  sections: { title: string; fields: ContentField[] }[];
}

const img = (id: string) => `https://lh3.googleusercontent.com/aida-public/${id}`;

export const contentSchema: ContentGroup[] = [
  {
    id: 'global',
    label: 'ზოგადი (ჰედერი და ფუტერი)',
    description: 'საიტის სახელი, ლოგო, ფუტერი და საკონტაქტო ინფორმაცია — ჩანს ყველა გვერდზე.',
    sections: [
      {
        title: 'ბრენდინგი',
        fields: [
          { key: 'siteTitle', label: 'საიტის სახელი (ჰედერში)', type: 'textarea', default: 'Georgian\nInstitute of\nPsychosynthesis', help: 'ახალი ხაზი = ახალი სტრიქონი ლოგოში' },
          { key: 'siteLogo', label: 'ლოგოს სურათი (არასავალდებულო)', type: 'image', default: '' },
          { key: 'loginButtonText', label: 'შესვლის ღილაკი', type: 'text', default: 'შესვლა' },
          { key: 'logoutButtonText', label: 'გამოსვლის ღილაკი', type: 'text', default: 'გამოსვლა' }
        ]
      },
      {
        title: 'ფუტერი',
        fields: [
          { key: 'aboutText', label: 'ფუტერის აღწერა', type: 'textarea', default: 'ქართული ფსიქოსინთეზის ინსტიტუტი არის წამყვანი აკადემიური და თერაპიული ცენტრი საქართველოში.' },
          { key: 'footerNavTitle', label: 'ნავიგაციის სვეტის სათაური', type: 'text', default: 'ნავიგაცია' },
          { key: 'footerContactTitle', label: 'კონტაქტის სვეტის სათაური', type: 'text', default: 'საკონტაქტო' },
          { key: 'footerContactPhone', label: 'ტელეფონი', type: 'text', default: '+995 32 2 100 200' },
          { key: 'footerContactEmail', label: 'ელ-ფოსტა', type: 'text', default: 'info@psychosynthesis.ge' },
          { key: 'footerAddress', label: 'მისამართი', type: 'text', default: '' },
          { key: 'footerCopyright', label: 'საავტორო უფლებები', type: 'text', default: '© 2026 ფსიქოსინთეზის ქართული ინსტიტუტი. ყველა უფლება დაცულია.' }
        ]
      }
    ]
  },
  {
    id: 'home',
    label: 'მთავარი გვერდი',
    description: 'ბანერის, შესავლისა და CTA-ს ძირითადი ტექსტები იცვლება „მთავარი გვერდის სექციებში“. აქ — დამატებითი ელემენტები.',
    sections: [
      {
        title: 'მთავარი ბანერი',
        fields: [
          { key: 'heroSecondaryCtaText', label: 'მეორე ღილაკის ტექსტი', type: 'text', default: 'პროგრამების გაცნობა' },
          { key: 'heroSecondaryCtaLink', label: 'მეორე ღილაკის ბმული', type: 'link', default: '/academic' }
        ]
      },
      {
        title: 'შესავალი სექცია',
        fields: [
          { key: 'historyText', label: 'გამოყოფილი ტექსტის ბლოკი', type: 'textarea', default: 'ჩვენი ინსტიტუტი საქართველოში პირველია, რომელიც სთავაზობს სრულყოფილ აკადემიურ და პრაქტიკულ ბაზას ამ მიმართულებით.' },
          { key: 'stat1Value', label: 'სტატისტიკა 1 — რიცხვი', type: 'text', default: '15+' },
          { key: 'stat1Label', label: 'სტატისტიკა 1 — წარწერა', type: 'text', default: 'წლის გამოცდილება' },
          { key: 'stat2Value', label: 'სტატისტიკა 2 — რიცხვი', type: 'text', default: '500+' },
          { key: 'stat2Label', label: 'სტატისტიკა 2 — წარწერა', type: 'text', default: 'კურსდამთავრებული' }
        ]
      },
      {
        title: 'სტატიების ბლოკი',
        fields: [
          { key: 'homePostsAllLink', label: '„ყველა სტატია“ ბმულის ტექსტი', type: 'text', default: 'ყველა სტატია' },
          { key: 'homeReadMore', label: '„წაკითხვა“ ტექსტი ბარათზე', type: 'text', default: 'წაკითხვა' }
        ]
      }
    ]
  },
  {
    id: 'founder',
    label: 'დამფუძნებლის გვერდი',
    description: 'დამფუძნებლის ბიოგრაფია, ფოტო, მიღწევები და გუნდი.',
    sections: [
      {
        title: 'ზედა ბლოკი',
        fields: [
          { key: 'founderLabel', label: 'ზედა წარწერა', type: 'text', default: 'დამფუძნებელი & დირექტორი' },
          { key: 'founderTitle', label: 'სახელი / სათაური', type: 'text', default: 'დოქტორი ელენე კვანტალიანი' },
          { key: 'founderSubtitle', label: 'ციტატა', type: 'textarea', default: '"ფსიქოსინთეზი არ არის მხოლოდ თერაპიული მეთოდი, ეს არის გზა საკუთარი თავის აღმოჩენისა და სულის მთლიანობისკენ."' },
          { key: 'founderBioButton', label: 'ღილაკის ტექსტი', type: 'text', default: 'ბიოგრაფია' },
          { key: 'founderImage', label: 'პორტრეტი', type: 'image', default: img('AB6AXuBdQndCelLkyiMEVVXT1eGOx40fLP5fHdm94PBem1bdfwGkCeIJ_KSj-3bscwLsivXqvLt-Oip751jfTKBRktTfrUL5aup2zT593qr7_0wQk0rpVlvJxNlsdqEB_lQKbqmbTm8_-V3oi-WTNTPD4R_1RYMcwi1jiBJXcdpbavJwUyqtXY6Ye3GkGBa031IJo690oHKNLN4h_sWfokG5CXkCgeqQeJTregJMmbl8s8yr0Z5JDcKSYiS4') }
        ]
      },
      {
        title: 'ბიოგრაფია',
        fields: [
          { key: 'founderBioHeading', label: 'სათაური', type: 'text', default: 'აკადემიური გზა და ხედვა' },
          { key: 'founderBioText', label: 'გამოყოფილი შესავალი', type: 'textarea', default: 'დოქტორი ელენე კვანტალიანი არის ინსტიტუტის დამფუძნებელი და წამყვანი ფსიქოთერაპევტი, რომელსაც აქვს 20-წლიანი გამოცდილება ინტეგრალურ ფსიქოლოგიასა და ფსიქოსინთეზის პრაქტიკაში.' },
          { key: 'founderBioBody', label: 'ბიოგრაფიის ტექსტი', type: 'richtext', default: '<p>დოქტორი ელენე კვანტალიანი არის ფსიქოლოგიის მეცნიერებათა დოქტორი და საქართველოში ფსიქოსინთეზის მიდგომის ერთ-ერთი წამყვანი პიონერი. მისი მოღვაწეობა მოიცავს ორ ათწლეულზე მეტს აკადემიურ კვლევებსა და კლინიკურ პრაქტიკაში, რაც საფუძვლად დაედო ინსტიტუტის ჩამოყალიბებას.</p><p>დღეს ელენე ხელმძღვანელობს ინსტიტუტის სასწავლო პროგრამებს და აგრძელებს აქტიურ მუშაობას ახალი თაობის ფსიქოლოგების მომზადებაზე, რომლებსაც სწამთ, რომ თერაპია არა მხოლოდ სიმპტომების მკურნალობა, არამედ პიროვნული ზრდის უწყვეტი პროცესია.</p>' },
          { key: 'founderSpecTitle', label: 'სპეციალიზაციის სათაური', type: 'text', default: 'სპეციალიზაცია' },
          { key: 'founderSpecList', label: 'სპეციალიზაციები', type: 'lines', default: 'კლინიკური ფსიქოსინთეზი\nტრანსპერსონალური თერაპია\nკრიზისული ინტერვენცია', help: 'თითო ხაზზე ერთი' },
          { key: 'founderLangTitle', label: 'ენების სათაური', type: 'text', default: 'ენები' },
          { key: 'founderLanguages', label: 'ენები', type: 'text', default: 'ქართული, ინგლისური, გერმანული, რუსული' }
        ]
      },
      {
        title: 'აკადემიური მიღწევები',
        fields: [
          { key: 'founderAchTitle', label: 'სექციის სათაური', type: 'text', default: 'აკადემიური მიღწევები' },
          { key: 'founderAchSubtitle', label: 'სექციის ქვესათაური', type: 'text', default: 'პუბლიკაციები, კვლევები და აღიარება' },
          { key: 'ach1Meta', label: 'დიდი ბარათი — წარწერა', type: 'text', default: '2022 • მონოგრაფია' },
          { key: 'ach1Title', label: 'დიდი ბარათი — სათაური', type: 'text', default: '"სულის რუკა: ფსიქოსინთეზის თანამედროვე ასპექტები"' },
          { key: 'ach1Text', label: 'დიდი ბარათი — ტექსტი', type: 'textarea', default: 'ინოვაციური ნაშრომი, რომელიც აერთიანებს კლასიკურ ფსიქოლოგიასა და თანამედროვე ნეირომეცნიერებას პიროვნული განვითარების კონტექსტში.' },
          { key: 'ach1LinkText', label: 'დიდი ბარათი — ბმულის ტექსტი', type: 'text', default: 'წაიკითხეთ მიმოხილვა' },
          { key: 'ach1Link', label: 'დიდი ბარათი — ბმული', type: 'link', default: '' },
          { key: 'ach2Title', label: 'ბარათი 2 — სათაური', type: 'text', default: 'ევროპული სერთიფიკაცია' },
          { key: 'ach2Text', label: 'ბარათი 2 — ტექსტი', type: 'textarea', default: 'EAP-ის მიერ აკრედიტებული ფსიქოთერაპევტი (2015 წლიდან)' },
          { key: 'ach3Title', label: 'ბარათი 3 — სათაური', type: 'text', default: 'წლის მკვლევარი' },
          { key: 'ach3Text', label: 'ბარათი 3 — ტექსტი', type: 'textarea', default: 'ეროვნული სამეცნიერო ფონდის ჯილდო ჰუმანიტარულ დარგში (2019)' },
          { key: 'ach4Title', label: 'ბარათი 4 — სათაური', type: 'text', default: '45+ სამეცნიერო პუბლიკაცია' },
          { key: 'ach4Text', label: 'ბარათი 4 — ტექსტი', type: 'textarea', default: 'საერთაშორისო რეცენზირებად ჟურნალებში გამოქვეყნებული სტატიები ფსიქოთერაპიის ეფექტურობის შესახებ.' }
        ]
      },
      {
        title: 'გუნდი და ციტატა',
        fields: [
          { key: 'founderTrainersLabel', label: 'გუნდის ზედა წარწერა', type: 'text', default: 'ინსტიტუტის პედაგოგები & თერაპევტები' },
          { key: 'founderTrainersTitle', label: 'გუნდის სათაური', type: 'text', default: 'ტრენერები & აკადემიური გუნდი' },
          { key: 'trainersText', label: 'გუნდის აღწერა', type: 'richtext', default: '<p>ჩვენი აკადემიური გუნდი შედგება სერტიფიცირებული ფსიქოლოგების, თერაპევტებისა და ტრენერებისგან, რომლებიც ატარებენ ინტენსიურ კურსებსა და ინდივიდუალურ კონსულტაციებს.</p>' },
          { key: 'founderQuote', label: 'ბოლო ციტატა', type: 'textarea', default: 'ჩვენი მიზანია არა მხოლოდ განკურნება, არამედ ადამიანის შინაგანი სინათლისა და პოტენციალის გააქტიურება.' }
        ]
      }
    ]
  },
  {
    id: 'academic',
    label: 'აკადემიური პორტალი',
    description: 'პორტალის სათაურები, ჩანართები და ღილაკები. კურსები, ბიბლიოთეკა და ბლოგები იმართება ცალკე ჩანართებში.',
    sections: [
      {
        title: 'სათაურები და ჩანართები',
        fields: [
          { key: 'academicLabel', label: 'ზედა წარწერა', type: 'text', default: 'Academia & Library' },
          { key: 'academicTitle', label: 'სათაური', type: 'text', default: 'აკადემიური პორტალი' },
          { key: 'academicSubtitle', label: 'ქვესათაური', type: 'textarea', default: 'გაიღრმავეთ ცოდნა ფსიქოსინთეზის თეორიაში, გაეცანით კლასიკურ ნაშრომებსა და უახლეს სამეცნიერო პუბლიკაციებს.' },
          { key: 'academicCoursesTab', label: 'კურსების ჩანართი', type: 'text', default: 'აკადემიური კურსები' },
          { key: 'academicLibraryTab', label: 'ბიბლიოთეკის ჩანართი', type: 'text', default: 'ბიბლიოთეკა' },
          { key: 'academicBlogsTab', label: 'ბლოგების ჩანართი', type: 'text', default: 'ბლოგები და პუბლიკაციები' },
          { key: 'academicSearchPlaceholder', label: 'ძებნის ველი', type: 'text', default: 'ძებნა...' }
        ]
      },
      {
        title: 'ბარათების ტექსტები',
        fields: [
          { key: 'academicModulesLabel', label: 'მოდულების წარწერა', type: 'text', default: 'პროგრამის მოდულები:' },
          { key: 'academicRegisterButton', label: 'კურსზე რეგისტრაციის ღილაკი', type: 'text', default: 'რეგისტრაციის მოთხოვნა' },
          { key: 'academicDownloadButton', label: 'მასალის ჩამოტვირთვის ღილაკი', type: 'text', default: 'მასალის ჩამოტვირთვა' },
          { key: 'academicYearSuffix', label: 'წლის სუფიქსი', type: 'text', default: 'წელი' },
          { key: 'academicReadMore', label: '„სრულად წაკითხვა“', type: 'text', default: 'სრულად წაკითხვა' }
        ]
      }
    ]
  },
  {
    id: 'events',
    label: 'ღონისძიებების გვერდი',
    description: 'გვერდის სათაურები, სტატისტიკა, კალენდარი და გალერეა. თავად ღონისძიებები იმართება „ღონისძიებების“ ჩანართში.',
    sections: [
      {
        title: 'ზედა ბლოკი',
        fields: [
          { key: 'eventsLabel', label: 'ზედა წარწერა', type: 'text', default: 'საჯარო პროგრამები' },
          { key: 'eventsTitle', label: 'სათაური', type: 'text', default: 'საჯარო აქტივობები და ღონისძიებები' },
          { key: 'eventsSubtitle', label: 'ქვესათაური', type: 'textarea', default: 'აღმოაჩინეთ თვითშემეცნების და პიროვნული ზრდის გზა ჩვენს სემინარებზე, ვორქშოფებსა და საჯარო ლექციებზე.' },
          { key: 'eventsHeroImage', label: 'ფონის სურათი (არასავალდებულო)', type: 'image', default: '' }
        ]
      },
      {
        title: 'ღონისძიებების ბლოკი',
        fields: [
          { key: 'eventsUpcomingLabel', label: 'ზედა წარწერა', type: 'text', default: 'კალენდარი' },
          { key: 'eventsUpcomingTitle', label: 'სათაური', type: 'text', default: 'მოახლოებული ღონისძიებები' },
          { key: 'eventsDefaultCta', label: 'რეგისტრაციის ღილაკი (ნაგულისხმევი)', type: 'text', default: 'რეგისტრაცია' },
          { key: 'eventsRegisterToast', label: 'შეტყობინება რეგისტრაციისას', type: 'text', default: 'რეგისტრაციის განაცხადი წარმატებით გაიგზავნა!' },
          { key: 'eventsTrainerLabel', label: '„ტრენერი“ წარწერა', type: 'text', default: 'ტრენერი' },
          { key: 'eventsEmptyText', label: 'ტექსტი, როცა ღონისძიება არ არის', type: 'text', default: 'ამ ეტაპზე დაგეგმილი ღონისძიებები არ არის.' },
          { key: 'eventsStatValue', label: 'სტატისტიკა — რიცხვი', type: 'text', default: '1,500+' },
          { key: 'eventsStatLabel', label: 'სტატისტიკა — წარწერა', type: 'text', default: 'კურსდამთავრებული და მონაწილე წელს' },
          { key: 'eventsStatLinkText', label: 'სტატისტიკა — ბმულის ტექსტი', type: 'text', default: 'გაიგე მეტი ჩვენს პროგრამებზე' },
          { key: 'eventsStatLink', label: 'სტატისტიკა — ბმული', type: 'link', default: '/academic' }
        ]
      },
      {
        title: 'კალენდარი და გალერეა',
        fields: [
          { key: 'eventsCalendarTitle', label: 'კალენდრის სათაური', type: 'text', default: 'ღონისძიებების კალენდარი' },
          { key: 'eventsCalendarText', label: 'კალენდრის ტექსტი', type: 'textarea', default: 'შეარჩიეთ თქვენთვის სასურველი თარიღი და დაგეგმეთ წინასწარ. ჩვენი კალენდარი მუდმივად ახლდება ახალი აქტივობებით.' },
          { key: 'eventsPastTitle', label: 'გალერეის სათაური', type: 'text', default: 'წარსული ღონისძიებები' },
          {
            key: 'eventsGallery', label: 'გალერეის სურათები', type: 'images', default: [
              img('AB6AXuD0lhF3W4NZ80cUwq7Y5kxFZwZMOZEAJs45-srrIOXC09WTyxGGJLJQ6lZiahyGp_C-Tv-4-psfuI8TBMAN6fY13tTxzPpNauZ2ms0E_VRqXdM_TCPQEYhxZIJkpjgNQCU7RX3xSRPDtufncTSkAuXeE4IbTrlfZxSUG0TdFdFZbpgtcuY4BZhHFbOtemh9I6KDuEMyvhI0ES34ZDnj4OMLzEfDrg66otFVvpBEQlzoQXZep79IUqwb'),
              img('AB6AXuAtmJyQq0bhFGkXUG3HgJkFe8TZh89X8ZfHswErnTrZePCGUQe8xMojo5zm1B2XStMaojpYaN8JbtwfBodgoEK-s1Pbe71iWYLJO68_mJxXCJr8GSdt8tc587jDiT7XvUD1BHJlrD-G91UpIYXA8g5B399WCs2hu6Tq_Ue-AmgGNV7Np85qQYP3UDv-0zJLixCtL20QLcuj6qHH7YSVBZyr0mgSonwuPfCEQG3bz17-W0wSZVzZ0Pdr'),
              img('AB6AXuB1NH4ph8Ja88KEYC4q2-nQoyy1dBHSsdZCZ-udhpyXWNM80Wmtr3FUAWWnKVPonRt271AQc4lnFePXaFmO0CtrhfBAehxrgHzEHbYH_sUTlNJQBJqWlkglzyIf6llMAf_UAjaWZlrlQqi9lrHi7VRxwHuMMB6iFFLv5xO71-f8x-gwabW2jVtKh8ryH5kTlD4t3OpSx0zdLTYPXST6lLKFaDUxK7sz3-CDlv1MRJDoa-4MW1DskUVU'),
              img('AB6AXuBfCjYYaUNXYsyzdLYHCWt66A20CBCP0uG37yLzexmK2__09XV-AjJa_FRXAoElW1Eo92V_7N4jQ8fQkC81LGgJspVNA7HRuEjmDysiTdAG6BejzIYMfFWFTDCA5UIsQWeBEY34ucRSS7oK0PhDHRuHH0p1XKN70UPCAPF0hZPdCxdLNHF58h08ui01lqXdMRs3MCrJ7p8rEv4G3btCUULw-6GY0OxPfx0XbYRCBqryJ58718eoqMo0')
            ].join('\n')
          }
        ]
      }
    ]
  },
  {
    id: 'other',
    label: 'სხვა გვერდები',
    description: 'მედიტაციის ოთახი და დინამიური გვერდების საერთო ელემენტები.',
    sections: [
      {
        title: 'მედიტაციის ოთახი',
        fields: [
          { key: 'practiceLabel', label: 'ზედა წარწერა', type: 'text', default: 'Meditation & Visualization Space' },
          { key: 'practiceTitle', label: 'სათაური', type: 'text', default: 'შინაგანი მედიტაციის ოთახი' },
          { key: 'practiceSubtitle', label: 'ქვესათაური', type: 'textarea', default: 'გამოიყენეთ სტრუქტურირებული მედიტაციები და სუნთქვითი ვარჯიშები შინაგანი ჰარმონიის მისაღწევად.' }
        ]
      },
      {
        title: 'დინამიური გვერდები და სტატიები',
        fields: [
          { key: 'dynamicPageLabel', label: 'გვერდის ზედა წარწერა', type: 'text', default: 'ფსიქოსინთეზის ინსტიტუტი' },
          { key: 'notFoundText', label: '„გვერდი ვერ მოიძებნა“ ტექსტი', type: 'text', default: 'გვერდი ვერ მოიძებნა ან წაშლილია' },
          { key: 'backHomeText', label: '„მთავარზე დაბრუნება“ ღილაკი', type: 'text', default: 'მთავარ გვერდზე დაბრუნება' },
          { key: 'articleBackText', label: 'სტატიიდან უკან დაბრუნების ღილაკი', type: 'text', default: 'უკან დაბრუნება' }
        ]
      }
    ]
  }
];

export const contentDefaults: Record<string, string> = Object.fromEntries(
  contentSchema.flatMap(g => g.sections.flatMap(s => s.fields.map(f => [f.key, f.default])))
);
