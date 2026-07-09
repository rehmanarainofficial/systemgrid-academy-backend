import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource, In } from 'typeorm';
import {
  academyEntities,
  Course,
  CourseCategory,
  CourseFAQ,
  CourseOutlineModule,
  CourseOutcome,
  CourseProject,
  CourseQuarter,
  CourseTool,
  CourseTopic,
} from '../entities';

config();

type QuarterSeed = {
  title: string;
  subtitle: string;
  description: string;
  modules: Array<{ title: string; description?: string; topics: string[] }>;
};

type CourseSeed = {
  category: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationMonths: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tools: string[];
  quarters: QuarterSeed[];
};

const categories = [
  'Development',
  'Data',
  'AI and Automation',
  'Design',
  'Marketing',
  'Cybersecurity',
  'Programming',
  'Languages',
  'Test Preparation',
];

const webDevelopmentQuarters: QuarterSeed[] = [
  {
    title: 'Quarter 1',
    subtitle: 'Frontend Foundations',
    description:
      'Build strong HTML, CSS, JavaScript, responsive layout, and browser interaction fundamentals.',
    modules: [
      {
        title: 'HTML Fundamentals',
        topics: [
          'HTML document structure',
          'Doctype, html, head, body',
          'Meta tags and SEO basics',
          'Headings, paragraphs, text formatting',
          'Links and navigation',
          'Images and media',
          'Lists and tables',
          'Forms and input fields',
          'Semantic HTML',
          'HTML accessibility basics',
          'HTML best practices',
          'Mini project: personal profile page',
        ],
      },
      {
        title: 'CSS Fundamentals',
        topics: [
          'CSS syntax and selectors',
          'Colors, units, typography',
          'Box model',
          'Margin, padding, border',
          'Display property',
          'Positioning',
          'Flexbox',
          'CSS Grid',
          'Responsive design basics',
          'Media queries',
          'Pseudo classes and pseudo elements',
          'CSS variables',
          'Transitions and transforms',
          'Modern layout practice',
          'Mini project: responsive landing page',
        ],
      },
      {
        title: 'JavaScript Fundamentals',
        topics: [
          'Variables and data types',
          'Operators',
          'Conditionals',
          'Loops',
          'Functions',
          'Arrays',
          'Objects',
          'DOM selection',
          'DOM manipulation',
          'Events',
          'Forms handling',
          'ES6 syntax',
          'Template literals',
          'Destructuring',
          'Spread and rest operators',
          'Array methods',
          'LocalStorage',
          'JSON',
          'Fetch API basics',
          'Async/await basics',
          'Error handling',
          'Mini project: interactive web app',
        ],
      },
    ],
  },
  {
    title: 'Quarter 2',
    subtitle: 'Modern Frontend Development',
    description:
      'Move from fundamentals into Tailwind CSS, React, Redux, Next.js, and Firebase-powered products.',
    modules: [
      module('Tailwind CSS', [
        'Tailwind setup',
        'Utility-first workflow',
        'Responsive utilities',
        'Flex and grid with Tailwind',
        'Spacing and sizing',
        'Colors and typography',
        'Dark mode',
        'Reusable component styling',
        'Forms and cards',
        'Dashboard layouts',
        'Animation utilities',
        'Mini project: modern SaaS landing page',
      ]),
      module('React Fundamentals', [
        'React setup',
        'Components',
        'Props',
        'State',
        'Events',
        'Conditional rendering',
        'Lists and keys',
        'Forms in React',
        'useEffect',
        'Component composition',
        'Custom hooks',
        'API integration',
        'React Router basics',
        'Project structure',
        'Mini project: course listing app',
      ]),
      module('Redux and State Management', [
        'State management concepts',
        'Redux Toolkit setup',
        'Slices',
        'Actions',
        'Reducers',
        'Store',
        'Async thunks',
        'RTK Query basics',
        'Global auth state',
        'Cart/course state example',
        'Mini project: student dashboard state',
      ]),
      module('Next.js', [
        'App Router',
        'Pages and layouts',
        'Server components',
        'Client components',
        'Dynamic routes',
        'Loading UI',
        'Error UI',
        'Metadata SEO',
        'Image optimization',
        'API routes basics',
        'Form handling',
        'Authentication flow',
        'Deployment basics',
        'Mini project: academy course website',
      ]),
      module('Firebase Basics', [
        'Firebase project setup',
        'Authentication',
        'Firestore basics',
        'Storage basics',
        'Security rules introduction',
        'Hosting overview',
        'Mini project: student notes app',
      ]),
    ],
  },
  {
    title: 'Quarter 3',
    subtitle: 'Backend and Full Stack Projects',
    description:
      'Complete backend APIs, databases, authentication, security, deployment, and portfolio-ready full-stack work.',
    modules: [
      module('Node.js', [
        'Node.js runtime',
        'npm and package management',
        'Modules',
        'File system basics',
        'Environment variables',
        'HTTP server basics',
        'Async programming',
        'Error handling',
      ]),
      module('Express.js', [
        'Express setup',
        'Routing',
        'Controllers',
        'Middleware',
        'Request validation',
        'Error middleware',
        'REST API structure',
        'CORS',
        'Rate limiting',
        'File uploads',
        'API documentation basics',
      ]),
      module('MongoDB and Mongoose', [
        'MongoDB concepts',
        'Collections and documents',
        'Mongoose schemas',
        'CRUD operations',
        'Relationships',
        'Indexes',
        'Aggregation basics',
        'Validation',
        'Pagination',
        'Filtering',
        'Search',
      ]),
      module('Authentication and Security', [
        'Password hashing',
        'JWT access token',
        'Refresh token',
        'HTTP-only cookies',
        'Role-based access',
        'Protected routes',
        'Input validation',
        'Security headers',
        'Basic API security',
      ]),
      module('Final Full Stack Project', [
        'Full stack academy/student portal module',
        'Frontend integration',
        'Backend API integration',
        'Authentication',
        'Dashboard',
        'CRUD',
        'Deployment',
        'Portfolio presentation',
      ]),
    ],
  },
];

const courses: CourseSeed[] = [
  {
    category: 'Development',
    title: 'React Native App Development',
    slug: 'app-development-react-native',
    shortDescription:
      'Build professional Android and iOS apps with React Native CLI, APIs, authentication, and release workflows.',
    description:
      'A React Native CLI course focused on production mobile apps. Expo is not used in this track.',
    durationMonths: 9,
    tools: [
      'React Native CLI',
      'TypeScript',
      'Android Studio',
      'Xcode',
      'Axios',
      'TanStack Query',
      'Redux Toolkit',
      'Zustand',
    ],
    quarters: [
      q(
        'JavaScript, TypeScript, React, and Mobile Foundations',
        'Mobile foundations',
        [
          'JavaScript revision',
          'TypeScript basics',
          'React fundamentals',
          'Mobile UI basics',
          'React Native CLI setup',
          'Android Studio setup',
          'Xcode overview if Mac available',
          'Device/emulator setup',
          'Project structure',
          'Components',
          'Props and state',
          'Styling in React Native',
          'Flexbox for mobile',
          'Responsive mobile layouts',
          'Text, View, ScrollView',
          'Touchable components',
          'TextInput and forms',
          'FlatList and SectionList',
          'Image handling',
          'SafeAreaView',
          'Keyboard handling',
          'Platform-specific code',
          'Reusable components',
          'Mini project: mobile profile app',
        ],
      ),
      q(
        'Professional React Native App Development',
        'Navigation, data, storage, permissions, and app UI',
        [
          'React Navigation',
          'Stack navigation',
          'Bottom tabs',
          'Drawer navigation',
          'Route params',
          'Form validation',
          'AsyncStorage',
          'Secure storage',
          'API integration with Axios',
          'TanStack Query basics',
          'Redux Toolkit or Zustand',
          'Camera and media basics',
          'Maps basics',
          'Permissions',
          'Push notification concept',
          'Theme system',
          'Dark/light mode',
          'Reusable app UI',
          'Attendance app UI',
          'Fee management app screens',
          'Course app dashboard',
        ],
      ),
      q(
        'Backend Integration and Production Deployment',
        'Backend APIs, performance, release signing, and app store preparation',
        [
          'Node.js and Express backend',
          'PostgreSQL or MongoDB API',
          'Authentication',
          'JWT with refresh token',
          'File upload',
          'Student/course APIs',
          'Push notifications',
          'Offline handling basics',
          'App performance',
          'Build APK',
          'Release signing',
          'Google Play Store preparation',
          'iOS build overview',
          'Final project: Complete student portal mobile app',
        ],
      ),
    ],
  },
  {
    category: 'Development',
    title: 'Desktop App Development',
    slug: 'desktop-app-development',
    shortDescription:
      'Build desktop apps with Electron.js, Next.js, local data, APIs, installers, and full-stack workflows.',
    description:
      'A nine-month desktop application development path for professional Windows-ready business systems.',
    durationMonths: 9,
    tools: [
      'Electron.js',
      'Next.js',
      'TypeScript',
      'Node.js',
      'Express.js',
      'SQLite',
      'MongoDB',
      'PostgreSQL',
    ],
    quarters: [
      q('Web and Desktop Foundations', 'Web skills and desktop UI thinking', [
        'HTML/CSS/JavaScript revision',
        'TypeScript basics',
        'Next.js basics',
        'Desktop UI principles',
        'File system concepts',
        'Local storage concepts',
        'App layout',
        'Dashboard UI',
        'Reusable components',
      ]),
      q(
        'Electron.js Professional Development',
        'Secure desktop architecture and native workflows',
        [
          'Electron architecture',
          'Main process',
          'Renderer process',
          'Preload scripts',
          'IPC communication',
          'Secure Electron setup',
          'Window management',
          'Menus',
          'Dialogs',
          'File system access',
          'Auto launch basics',
          'Native notifications',
          'Printing',
          'PDF generation',
          'Local database options',
          'SQLite basics',
          'Packaging basics',
        ],
      ),
      q(
        'Full Stack Desktop System',
        'Backend APIs, data, sync, installers, and ERP capstone',
        [
          'Node.js backend',
          'Express APIs',
          'Database integration',
          'MongoDB/PostgreSQL/MySQL',
          'Authentication',
          'Role-based access',
          'Offline/online sync concept',
          'Auto updates',
          'Installer generation',
          'Windows build',
          'Final project: Desktop ERP or institute management system',
        ],
      ),
    ],
  },
  stackCourse(
    'MEAN Stack Development',
    'mean-stack-development',
    'MongoDB, Express, Angular, and Node.js full-stack academy management systems.',
    ['MongoDB', 'Express.js', 'Angular', 'Node.js', 'TypeScript', 'RxJS'],
    [
      'Web and TypeScript Foundations',
      'Angular Frontend Development',
      'Node, Express, MongoDB Backend',
    ],
    [
      [
        'HTML',
        'CSS',
        'JavaScript',
        'TypeScript',
        'Git/GitHub',
        'REST API concepts',
        'UI layout basics',
      ],
      [
        'Angular setup',
        'Components',
        'Templates',
        'Directives',
        'Pipes',
        'Services',
        'Dependency injection',
        'Routing',
        'Reactive forms',
        'Form validation',
        'HTTP client',
        'Interceptors',
        'Guards',
        'RxJS basics',
        'State management basics',
        'Angular Material or shadcn-like UI alternative',
        'Project: Admin dashboard frontend',
      ],
      [
        'Node.js',
        'Express.js',
        'MongoDB',
        'Mongoose',
        'Authentication',
        'JWT',
        'Role-based access',
        'File upload',
        'Pagination',
        'Filtering',
        'API integration with Angular',
        'Deployment',
        'Final project: Full MEAN academy management system',
      ],
    ],
  ),
  stackCourse(
    'PERN Stack Development',
    'pern-stack-development',
    'PostgreSQL, Express, React, and Node.js SaaS dashboards and student portals.',
    [
      'PostgreSQL',
      'Express.js',
      'React',
      'Node.js',
      'Redux Toolkit',
      'TanStack Query',
    ],
    [
      'Frontend and JavaScript Foundations',
      'React Professional Frontend',
      'Node, Express, PostgreSQL Backend',
    ],
    [
      [
        'HTML',
        'CSS',
        'JavaScript',
        'TypeScript basics',
        'React basics',
        'Git/GitHub',
        'REST API concepts',
      ],
      [
        'React components',
        'Hooks',
        'Forms',
        'Validation',
        'Routing',
        'State management',
        'Redux Toolkit',
        'TanStack Query',
        'Reusable components',
        'Dashboard UI',
        'Authentication UI',
        'API integration',
        'Mini project: Student portal frontend',
      ],
      [
        'Node.js',
        'Express.js',
        'PostgreSQL fundamentals',
        'SQL basics',
        'Tables and relations',
        'Joins',
        'Indexes',
        'Prisma or TypeORM',
        'Authentication',
        'JWT',
        'Role-based access',
        'Transactions',
        'API security',
        'Deployment',
        'Final project: Full PERN SaaS dashboard',
      ],
    ],
  ),
  stackCourse(
    'MERN Stack Development',
    'mern-stack-development',
    'MongoDB, Express, React, Redux Toolkit, TypeScript, Next.js, Firebase, and Tailwind CSS for production-ready full-stack apps.',
    [
      'MongoDB',
      'Express.js',
      'React',
      'Redux Toolkit',
      'TypeScript',
      'Next.js',
      'Firebase',
      'Tailwind CSS',
      'Node.js',
    ],
    [
      'JavaScript, TypeScript, and Tailwind Foundations',
      'React, Redux, and Next.js Professional Frontend',
      'MongoDB, Express, Firebase, and MERN Deployment',
    ],
    [
      [
        'HTML and CSS revision',
        'JavaScript ES6+',
        'TypeScript basics',
        'Types and interfaces',
        'Tailwind CSS setup',
        'Utility-first styling',
        'Responsive layouts',
        'Git and GitHub',
        'REST API concepts',
        'JSON and fetch',
        'Environment variables',
        'Mini project: Tailwind landing page',
      ],
      [
        'React components and hooks',
        'Props and state patterns',
        'React Router',
        'Forms and validation',
        'Redux Toolkit store setup',
        'Slices and async thunks',
        'API integration patterns',
        'Next.js App Router',
        'Server and client components',
        'Layouts and routing',
        'Authentication UI',
        'Reusable dashboard components',
        'Mini project: Next.js admin frontend',
      ],
      [
        'Node.js and Express.js',
        'MongoDB and Mongoose',
        'Schema design',
        'CRUD APIs',
        'JWT authentication',
        'Role-based access',
        'Firebase Auth integration',
        'Firestore basics',
        'File uploads',
        'Cloudinary or S3 uploads',
        'API security basics',
        'Deployment with Vercel and Render',
        'Final project: Full MERN SaaS dashboard',
      ],
    ],
  ),
  {
    category: 'Development',
    title: 'Python Django Full Stack Web Development',
    slug: 'django-full-stack-web-development',
    shortDescription:
      'Build scalable web apps with Django, Django Admin, Django REST Framework, PostgreSQL, and modern frontend integration.',
    description:
      'A twelve-month Python Django full stack program covering MVT architecture, admin panels, REST APIs, authentication, and production deployment.',
    durationMonths: 12,
    tools: [
      'Python',
      'Django',
      'Django REST Framework',
      'PostgreSQL',
      'HTML',
      'CSS',
      'JavaScript',
      'Bootstrap',
      'Docker',
    ],
    quarters: [
      q('Python and Web Foundations', 'Core programming and frontend basics', [
        'Python fundamentals',
        'Functions and modules',
        'OOP basics',
        'Virtual environments',
        'HTML and CSS',
        'JavaScript basics',
        'Bootstrap layout',
        'Git and GitHub',
        'SQL fundamentals',
        'PostgreSQL basics',
        'Mini project: Python utility scripts',
      ]),
      q('Django Framework and Admin Panel', 'MVT, models, templates, and Django admin', [
        'Django project setup',
        'Apps and project structure',
        'URLs and views',
        'Templates and template inheritance',
        'Static and media files',
        'Models and migrations',
        'ORM and QuerySets',
        'Model relationships',
        'Django Admin customization',
        'Admin actions and filters',
        'Forms and ModelForms',
        'Class-based views',
        'Mini project: Institute management system',
      ]),
      q('Django REST Framework and API Integration', 'Serializers, auth, permissions, and frontend API consumption', [
        'Django REST Framework setup',
        'Serializers and validation',
        'ViewSets and routers',
        'API versioning',
        'JWT authentication',
        'Permissions and throttling',
        'Pagination and filtering',
        'File upload APIs',
        'API documentation with Swagger',
        'Testing APIs with Postman',
        'Frontend API integration',
        'Mini project: Student portal API',
      ]),
      q('Advanced Django, Deployment, and Capstone', 'Caching, Celery, Docker, CI/CD, and portfolio project', [
        'Middleware and signals',
        'Caching strategies',
        'Celery background tasks',
        'Email and notifications',
        'Security best practices',
        'Performance optimization',
        'Docker containerization',
        'Environment configuration',
        'CI/CD basics',
        'Cloud deployment overview',
        'Portfolio documentation',
        'Final project: Full Django full-stack platform',
      ]),
    ],
  },
  {
    category: 'Development',
    title: 'Python Full-Stack Development with FastAPI and Flask',
    slug: 'python-fastapi-flask-full-stack',
    shortDescription:
      'Master FastAPI, Flask, SQLAlchemy, Pydantic, JWT auth, React integration, Docker, and production API deployment.',
    description:
      'A twelve-month Python full-stack track for high-performance APIs with FastAPI and Flask, modern frontend integration, and real-world deployment workflows.',
    durationMonths: 12,
    level: 'intermediate',
    tools: [
      'Python',
      'FastAPI',
      'Flask',
      'SQLAlchemy',
      'Pydantic',
      'PostgreSQL',
      'Alembic',
      'React',
      'Docker',
      'Pytest',
    ],
    quarters: [
      q('Python and Flask Web Foundations', 'Python backend basics and Flask apps', [
        'Python revision',
        'Virtual environments',
        'Flask setup and routing',
        'Jinja2 templates',
        'Forms and sessions',
        'Flask blueprints',
        'SQLAlchemy basics',
        'Database models',
        'CRUD with Flask',
        'Authentication basics',
        'Mini project: Flask blog app',
      ]),
      q('FastAPI, Pydantic, and REST API Mastery', 'Modern async APIs with validation and docs', [
        'FastAPI introduction',
        'Path and query parameters',
        'Pydantic models',
        'Request and response schemas',
        'Dependency injection',
        'SQLAlchemy with FastAPI',
        'Alembic migrations',
        'JWT and OAuth2',
        'File uploads',
        'Background tasks',
        'WebSockets basics',
        'OpenAPI and Swagger UI',
        'Mini project: FastAPI task manager API',
      ]),
      q('Full-Stack Integration with React', 'Connect React frontend to Python APIs end-to-end', [
        'React fundamentals',
        'Component architecture',
        'React Router',
        'API client setup',
        'Auth flow end-to-end',
        'State management basics',
        'Form handling',
        'Error handling',
        'Pagination and filters',
        'File upload UI',
        'Environment configuration',
        'Mini project: React + FastAPI dashboard',
      ]),
      q('Testing, Docker, Deployment, and Capstone', 'Production readiness and portfolio project', [
        'Pytest for APIs',
        'Integration testing',
        'Docker and Docker Compose',
        'Environment secrets',
        'Logging and monitoring',
        'Rate limiting',
        'API security hardening',
        'CI/CD pipeline basics',
        'VPS deployment',
        'Performance tuning',
        'Documentation and portfolio',
        'Final project: Production Python full-stack SaaS app',
      ]),
    ],
  },
  {
    category: 'Development',
    title: 'Laravel Full Stack Web Development',
    slug: 'laravel-full-stack-web-development',
    shortDescription:
      'Learn modern PHP, Laravel MVC, Eloquent ORM, Blade, Livewire, REST APIs, authentication, and full-stack Laravel apps.',
    description:
      'A twelve-month Laravel full stack specialization from PHP foundations to advanced Laravel architecture, APIs, testing, and deployment.',
    durationMonths: 12,
    tools: [
      'PHP 8',
      'Laravel',
      'Blade',
      'Livewire',
      'Tailwind CSS',
      'MySQL',
      'Composer',
      'PHPUnit',
      'Pest',
      'Docker',
    ],
    quarters: [
      q('PHP, Frontend, and Laravel Foundations', 'Modern PHP and Laravel basics', [
        'HTML, CSS, JavaScript',
        'PHP 8 fundamentals',
        'OOP in PHP',
        'Composer and autoloading',
        'Laravel installation',
        'Routing and controllers',
        'Blade templating',
        'Migrations and seeders',
        'Eloquent ORM basics',
        'CRUD operations',
        'Mini project: Laravel blog',
      ]),
      q('Authentication, APIs, and Admin Features', 'Secure apps with roles, APIs, and admin workflows', [
        'Laravel authentication',
        'Registration and login',
        'Roles and permissions',
        'Middleware',
        'Form requests and validation',
        'RESTful API development',
        'API resources',
        'Sanctum or Passport auth',
        'File storage',
        'Queues and jobs',
        'Notifications',
        'Mini project: Laravel CRM API',
      ]),
      q('Livewire, Tailwind, and Full-Stack UI', 'TALL stack patterns and dynamic interfaces', [
        'Tailwind CSS in Laravel',
        'Alpine.js basics',
        'Livewire components',
        'Reactive forms',
        'Pagination and search',
        'Inertia overview',
        'Vue or React integration basics',
        'Payment gateway concepts',
        'E-commerce cart flow',
        'Admin dashboard UI',
        'Mini project: Laravel e-commerce frontend',
      ]),
      q('Testing, Architecture, Deployment, and Capstone', 'Professional Laravel engineering practices', [
        'PHPUnit and Pest testing',
        'Feature and unit tests',
        'Service layer patterns',
        'Repository pattern',
        'Caching and optimization',
        'Laravel Forge or VPS deploy',
        'Docker for Laravel',
        'CI/CD basics',
        'Security hardening',
        'Performance tuning',
        'Portfolio presentation',
        'Final project: Laravel full-stack business platform',
      ]),
    ],
  },
  {
    category: 'Development',
    title: 'ASP.NET Core and Next.js Full Stack Development',
    slug: 'aspnet-core-nextjs-full-stack',
    shortDescription:
      'Build enterprise apps with ASP.NET Core Web API, Entity Framework, JWT auth, Next.js App Router, and cloud deployment.',
    description:
      'A twelve-month full-stack program combining ASP.NET Core backend engineering with modern Next.js frontend development and production deployment.',
    durationMonths: 12,
    level: 'intermediate',
    tools: [
      'C#',
      'ASP.NET Core',
      'Entity Framework Core',
      'SQL Server',
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'Docker',
      'Azure',
    ],
    quarters: [
      q('C#, .NET, and Web API Foundations', 'Backend fundamentals with ASP.NET Core', [
        'C# fundamentals',
        'OOP in C#',
        'LINQ',
        'ASP.NET Core setup',
        'Minimal APIs and controllers',
        'Dependency injection',
        'Entity Framework Core',
        'Migrations',
        'CRUD APIs',
        'DTOs and mapping',
        'Mini project: .NET inventory API',
      ]),
      q('Authentication, Security, and Advanced APIs', 'Identity, JWT, roles, and robust API design', [
        'ASP.NET Core Identity',
        'JWT authentication',
        'Role-based authorization',
        'Policy-based auth',
        'Validation and filters',
        'Exception handling',
        'Logging',
        'Repository and unit of work',
        'API versioning',
        'Swagger documentation',
        'Mini project: Secure multi-role API',
      ]),
      q('Next.js Frontend and Full-Stack Integration', 'Modern frontend with App Router and API integration', [
        'TypeScript revision',
        'Next.js App Router',
        'Server and client components',
        'Layouts and routing',
        'Tailwind CSS',
        'Forms and validation',
        'NextAuth or custom auth flow',
        'API integration patterns',
        'State management',
        'Dashboard UI',
        'Mini project: Next.js business dashboard',
      ]),
      q('Microservices Basics, Docker, Deployment, and Capstone', 'Production architecture and portfolio delivery', [
        'Clean architecture overview',
        'Service boundaries',
        'Docker containerization',
        'Docker Compose',
        'CI/CD with GitHub Actions',
        'Azure App Service basics',
        'Performance optimization',
        'Caching strategies',
        'SignalR real-time basics',
        'Testing with xUnit',
        'Portfolio documentation',
        'Final project: ASP.NET Core + Next.js enterprise app',
      ]),
    ],
  },
  {
    category: 'Data',
    title: 'Data Science and Analytics',
    slug: 'data-science-and-analytics',
    shortDescription:
      'Master Python, statistics, analytics, machine learning, dashboards, and portfolio-ready data projects.',
    description:
      'A twelve-month data science and analytics roadmap built around real datasets, business insights, ML models, dashboards, and a capstone portfolio.',
    durationMonths: 12,
    level: 'intermediate',
    tools: [
      'Python',
      'NumPy',
      'Pandas',
      'Matplotlib',
      'Seaborn',
      'Scikit-learn',
      'SQL',
      'Power BI',
      'Jupyter Notebook',
      'GitHub',
    ],
    quarters: [
      q(
        'Python, Statistics, and Data Foundations',
        'Python programming, statistics thinking, and clean dataset preparation',
        [
          'Python fundamentals',
          'Jupyter Notebook workflow',
          'NumPy',
          'Pandas',
          'Data types and structures',
          'Descriptive statistics',
          'Probability basics',
          'Data cleaning',
          'Missing value handling',
          'Outlier detection',
          'Exploratory data analysis',
          'Mini project: sales data insight report',
        ],
      ),
      q(
        'Data Visualization and Business Analytics',
        'Charts, dashboards, storytelling, SQL, and business decision support',
        [
          'Matplotlib',
          'Seaborn',
          'Chart selection',
          'Dashboard planning',
          'SQL basics',
          'Joins and aggregations',
          'Business KPIs',
          'Cohort analysis',
          'Power BI fundamentals',
          'Interactive dashboards',
          'Data storytelling',
          'Mini project: business analytics dashboard',
        ],
      ),
      q(
        'Machine Learning for Data Science',
        'Feature engineering, model training, evaluation, and practical prediction apps',
        [
          'Feature engineering',
          'Train/test split',
          'Scikit-learn',
          'Regression',
          'Classification',
          'Clustering basics',
          'Evaluation metrics',
          'Model comparison',
          'Model interpretation',
          'Data leakage prevention',
          'Mini project: customer churn prediction',
        ],
      ),
      q(
        'Portfolio Capstone and Real Data Projects',
        'End-to-end data science workflow, presentation, deployment basics, and portfolio polish',
        [
          'Project scoping',
          'Dataset sourcing',
          'Notebook organization',
          'GitHub portfolio',
          'Report writing',
          'Stakeholder presentation',
          'Dashboard publishing',
          'Model packaging basics',
          'Interview case study practice',
          'Final project: end-to-end data science capstone',
        ],
      ),
    ],
  },
  {
    category: 'Data',
    title: 'Data Analysis',
    slug: 'data-analysis',
    shortDescription:
      'Learn Excel, SQL, Python, dashboards, reporting, and business analysis with practical datasets.',
    description:
      'A six-month data analysis course focused on cleaning data, writing queries, building dashboards, and explaining insights for business decisions.',
    durationMonths: 6,
    tools: [
      'Excel',
      'SQL',
      'Python',
      'Pandas',
      'Power BI',
      'Google Sheets',
      'Looker Studio',
    ],
    quarters: [
      q(
        'Spreadsheet Analytics and SQL Foundations',
        'Excel, Google Sheets, SQL queries, data cleaning, and reporting basics',
        [
          'Excel formulas',
          'Pivot tables',
          'Data validation',
          'Cleaning messy sheets',
          'Google Sheets reporting',
          'SQL basics',
          'Filtering and sorting',
          'Joins',
          'Aggregations',
          'Case statements',
          'Mini project: monthly sales report',
        ],
      ),
      q(
        'Python Analysis and Dashboard Reporting',
        'Python, Pandas, visualization, Power BI, and insight storytelling',
        [
          'Python for analysts',
          'Pandas',
          'CSV and Excel import',
          'Data cleaning workflows',
          'Grouping and summaries',
          'Matplotlib basics',
          'Power BI fundamentals',
          'Dashboard layout',
          'Business KPI cards',
          'Data storytelling',
          'Final project: business analysis dashboard',
        ],
      ),
    ],
  },
  {
    category: 'AI and Automation',
    title: 'AI Development and Automation',
    slug: 'ai-development-automation',
    shortDescription:
      'Learn Python, ML, deep learning, LLM apps, RAG, agents, APIs, and business automation systems.',
    description:
      'A twelve-month AI development and automation roadmap for practical AI products and business workflows.',
    durationMonths: 12,
    level: 'intermediate',
    tools: [
      'Python',
      'NumPy',
      'Pandas',
      'Scikit-learn',
      'PyTorch',
      'OpenAI API',
      'FastAPI',
      'LangChain',
      'Vector Databases',
      'n8n',
    ],
    quarters: [
      q(
        'Python, Data, and Machine Learning Foundations',
        'Python, data cleaning, feature engineering, and ML prediction apps',
        [
          'Python fundamentals',
          'Functions',
          'OOP',
          'File handling',
          'Virtual environments',
          'NumPy',
          'Pandas',
          'Matplotlib',
          'Seaborn alternative if needed',
          'Data cleaning',
          'Feature engineering',
          'Scikit-learn',
          'Train/test split',
          'Regression',
          'Classification',
          'Evaluation metrics',
          'Mini project: ML prediction app',
        ],
      ),
      q(
        'Deep Learning and AI Application Development',
        'Neural networks, AI APIs, prompt engineering, and FastAPI',
        [
          'Neural network basics',
          'PyTorch or TensorFlow',
          'Tensors',
          'Autograd',
          'Training loops',
          'Computer vision basics',
          'NLP basics',
          'Transformers introduction',
          'Embeddings',
          'OpenAI API',
          'Gemini API',
          'Prompt engineering',
          'Structured outputs',
          'Function calling',
          'FastAPI for AI APIs',
          'Mini project: AI text classifier or image classifier',
        ],
      ),
      q(
        'LLM Apps, RAG, Agents, and Vector Databases',
        'RAG systems, vector search, agents, memory, and evaluation',
        [
          'LLM application architecture',
          'RAG concepts',
          'Document loaders',
          'Chunking',
          'Embeddings',
          'Vector databases',
          'Chroma',
          'Pinecone',
          'Qdrant',
          'FAISS basics',
          'LangChain',
          'LlamaIndex',
          'AI agents',
          'Tools',
          'Memory',
          'Retrieval pipelines',
          'Evaluation',
          'Hallucination reduction',
          'Guardrails basics',
          'Mini project: Company document chatbot',
        ],
      ),
      q(
        'AI Automation and Business Workflows',
        'n8n, webhooks, business workflows, scraping, Docker, and monitoring',
        [
          'n8n fundamentals',
          'Zapier overview',
          'Make overview',
          'Webhook automation',
          'API automation',
          'Google Sheets automation',
          'Gmail automation',
          'WhatsApp automation concept',
          'CRM automation',
          'Lead automation',
          'AI customer support bot',
          'AI sales assistant',
          'Scraping basics with Playwright/Selenium/BeautifulSoup',
          'Scheduled workflows',
          'Human approval workflows',
          'Deployment with Docker',
          'Monitoring',
          'Final project: AI automation system for a real business',
        ],
      ),
    ],
  },
  simpleCourse(
    'Design',
    'Graphic Designing',
    'graphic-designing',
    6,
    ['Canva', 'Photoshop', 'Illustrator', 'Figma'],
    [
      [
        'Design Foundations and Core Tools',
        [
          'Design principles',
          'Color theory',
          'Typography',
          'Spacing and alignment',
          'Layout hierarchy',
          'Brand identity basics',
          'Canva professional workflow',
          'Adobe Photoshop basics',
          'Adobe Illustrator basics',
          'Image editing',
          'Social media post design',
          'Poster design',
          'Banner design',
          'Mini project: Complete brand post kit',
        ],
      ],
      [
        'Branding, UI Design, and Portfolio',
        [
          'Logo design',
          'Brand guidelines',
          'Business card design',
          'Flyer design',
          'Brochure design',
          'Social media campaign design',
          'Figma basics',
          'UI design principles',
          'Landing page design',
          'Mobile app UI basics',
          'Design handoff',
          'Client brief handling',
          'Portfolio building',
          'Final project: Complete brand identity and social media campaign',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Marketing',
    'Digital Marketing',
    'digital-marketing',
    3,
    ['Meta Ads', 'Google Ads', 'SEO', 'Analytics', 'Email Marketing'],
    [
      [
        'Digital Marketing and Paid Ads Foundation',
        [
          'Digital marketing overview',
          'Marketing funnel',
          'Content strategy',
          'Copywriting basics',
          'Social media marketing',
          'Facebook page management',
          'Instagram marketing',
          'Meta Ads basics',
          'Google Ads basics',
          'Keyword research',
          'SEO fundamentals',
          'On-page SEO',
          'Off-page SEO basics',
          'Technical SEO basics',
          'Google Analytics',
          'Google Search Console',
          'Email marketing basics',
          'WhatsApp marketing ethics',
          'Lead generation',
          'Landing page optimization',
          'Campaign reporting',
          'Final project: Launch a complete digital campaign',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Cybersecurity',
    'Cybersecurity',
    'cybersecurity',
    9,
    [
      'Linux',
      'Networking',
      'Python',
      'Nmap',
      'Wireshark',
      'Burp Suite',
      'SIEM',
    ],
    [
      [
        'IT, Networking, Linux, and Security Foundations',
        [
          'Computer systems basics',
          'Operating systems overview',
          'Networking fundamentals',
          'IP addresses',
          'DNS',
          'HTTP/HTTPS',
          'Ports and protocols',
          'OSI model',
          'TCP/IP',
          'Linux basics',
          'Windows security basics',
          'Command line basics',
          'Python scripting basics',
          'Cybersecurity concepts',
          'CIA triad',
          'Authentication',
          'Authorization',
          'Encryption basics',
          'Risk and compliance basics',
          'Security policies',
          'Mini project: Secure a basic Linux server lab',
        ],
      ],
      [
        'Defensive Security, Web Security, and Vulnerability Assessment',
        [
          'Threats and vulnerabilities',
          'Malware concepts',
          'Phishing awareness',
          'Social engineering defense',
          'OWASP Top 10',
          'Web app security basics',
          'Input validation',
          'Authentication flaws',
          'Session security',
          'SQL injection concept in lab',
          'XSS concept in lab',
          'CSRF concept in lab',
          'Security testing methodology',
          'Nmap basics',
          'Wireshark basics',
          'Burp Suite basics',
          'Vulnerability scanning in lab',
          'Patch management',
          'Hardening basics',
          'Mini project: Web security lab report',
        ],
      ],
      [
        'SOC, Incident Response, Cloud Security, and Capstone',
        [
          'SOC analyst workflow',
          'Log analysis',
          'SIEM concepts',
          'Security monitoring',
          'Incident response lifecycle',
          'Digital forensics basics',
          'Endpoint security',
          'Cloud security basics',
          'IAM basics',
          'Backup and recovery',
          'Disaster recovery',
          'Governance basics',
          'Security documentation',
          'Report writing',
          'Career roadmap',
          'Final project: SOC-style incident investigation and security report',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Programming',
    'Programming Fundamentals',
    'programming-fundamentals',
    3,
    ['Python', 'JavaScript', 'Java', 'C++', 'C#'],
    [
      [
        'Programming Fundamentals',
        [
          'Environment setup',
          'Variables',
          'Data types',
          'Operators',
          'Input/output',
          'Conditions',
          'Loops',
          'Functions',
          'Arrays/lists',
          'Strings',
          'Objects/classes',
          'OOP basics',
          'Error handling',
          'File handling',
          'Modules/packages',
          'Basic problem solving',
          'Debugging',
          'Python pip and venv',
          'JavaScript Node.js and npm',
          'Java JDK setup',
          'C++ STL basics',
          'Mini projects',
          'Final project: Console-based practical application',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Programming',
    'DSA with Programming Language',
    'dsa',
    6,
    ['Python', 'JavaScript', 'Java', 'C++'],
    [
      [
        'Core Data Structures and Problem Solving',
        [
          'Big O notation',
          'Time complexity',
          'Space complexity',
          'Arrays',
          'Strings',
          'Two pointers',
          'Sliding window',
          'Hash maps',
          'Sets',
          'Stacks',
          'Queues',
          'Linked lists',
          'Recursion',
          'Sorting',
          'Searching',
          'Binary search',
          'Practice problems',
          'Mini project: Problem-solving tracker',
        ],
      ],
      [
        'Advanced DSA and Interview Preparation',
        [
          'Trees',
          'Binary trees',
          'BST',
          'Heaps',
          'Priority queues',
          'Tries',
          'Graphs',
          'BFS',
          'DFS',
          'Topological sort',
          'Greedy algorithms',
          'Dynamic programming',
          'Backtracking',
          'Intervals',
          'Bit manipulation basics',
          'Interview patterns',
          'Mock interview practice',
          'Final project: DSA problem portfolio',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Languages',
    'English Language',
    'english-language',
    6,
    ['Grammar', 'Speaking', 'Writing', 'Presentation', 'Interview English'],
    [
      [
        'English Foundations',
        [
          'Grammar basics',
          'Tenses',
          'Sentence structure',
          'Vocabulary building',
          'Pronunciation',
          'Listening practice',
          'Speaking confidence',
          'Reading comprehension',
          'Daily conversation',
          'Writing short paragraphs',
          'Common mistakes',
          'Mini project: Self-introduction and daily conversation practice',
        ],
      ],
      [
        'Professional English and Communication',
        [
          'Presentation skills',
          'Interview English',
          'Email writing',
          'Workplace communication',
          'Freelancing communication',
          'Client conversation',
          'Technical English for IT',
          'Group discussion',
          'Public speaking',
          'CV and LinkedIn English',
          'Final project: Professional presentation and interview simulation',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Languages',
    'Chinese Language',
    'chinese-language',
    6,
    ['Pinyin', 'HSK 1', 'HSK 2', 'Conversation', 'Listening'],
    [
      [
        'Chinese Language Foundations',
        [
          'Pinyin',
          'Tones',
          'Basic pronunciation',
          'Basic greetings',
          'Numbers',
          'Dates and time',
          'Daily vocabulary',
          'Simple sentences',
          'Listening basics',
          'Reading simple characters',
          'HSK 1 vocabulary',
          'Mini project: Basic self-introduction in Chinese',
        ],
      ],
      [
        'Practical Chinese Communication',
        [
          'HSK 2 vocabulary',
          'Daily conversation',
          'Travel Chinese',
          'Business basics',
          'Reading practice',
          'Listening practice',
          'Speaking drills',
          'Writing simple sentences',
          'Role-play conversations',
          'Final project: Chinese conversation presentation',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Test Preparation',
    'IELTS Preparation',
    'ielts-preparation',
    3,
    [
      'IELTS Listening',
      'IELTS Reading',
      'IELTS Writing',
      'IELTS Speaking',
      'Mock Tests',
    ],
    [
      [
        'IELTS Complete Preparation',
        [
          'IELTS overview',
          'Band score understanding',
          'Listening section',
          'Reading section',
          'Writing Task 1',
          'Writing Task 2',
          'Speaking Part 1',
          'Speaking Part 2',
          'Speaking Part 3',
          'Vocabulary development',
          'Grammar accuracy',
          'Time management',
          'Mock tests',
          'Feedback sessions',
          'Final project: Complete IELTS mock exam',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Programming',
    'DIT (Diploma in Information Technology)',
    'dit-1-year',
    12,
    [
      'Computer Basics',
      'MS Office',
      'Web Development',
      'Programming',
      'Database',
      'Networking',
    ],
    [
      [
        'Computer and Office Foundations',
        [
          'Computer hardware basics',
          'Operating systems',
          'MS Word',
          'MS Excel',
          'MS PowerPoint',
          'Internet and email',
          'Typing and productivity',
          'File management',
          'Digital literacy',
          'Mini project: Office workflow portfolio',
        ],
      ],
      [
        'Programming, Web, and Database Skills',
        [
          'HTML and CSS basics',
          'JavaScript fundamentals',
          'Programming logic',
          'Python or C++ basics',
          'Database concepts',
          'SQL basics',
          'Networking fundamentals',
          'Cybersecurity awareness',
          'Mini project: Basic web and database app',
        ],
      ],
      [
        'Professional IT Skills and Final Diploma Project',
        [
          'Advanced office automation',
          'Web project development',
          'Database mini project',
          'Freelancing basics',
          'Communication skills',
          'Portfolio building',
          'Interview preparation',
          'Final project: Complete DIT diploma portfolio project',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Programming',
    'CIT (Certificate in Information Technology)',
    'cit-6-month',
    6,
    [
      'Computer Basics',
      'MS Office',
      'Web Development',
      'Programming',
      'Database',
    ],
    [
      [
        'Computer and Office Skills',
        [
          'Computer fundamentals',
          'Windows basics',
          'MS Word',
          'MS Excel',
          'MS PowerPoint',
          'Internet usage',
          'Email communication',
          'File organization',
          'Mini project: Office skills assignment',
        ],
      ],
      [
        'Web, Programming, and Certificate Project',
        [
          'HTML basics',
          'CSS basics',
          'JavaScript introduction',
          'Programming logic',
          'Database introduction',
          'SQL basics',
          'Basic troubleshooting',
          'Portfolio basics',
          'Final project: CIT certificate practical project',
        ],
      ],
    ],
  ),
  simpleCourse(
    'Design',
    'Video Editing',
    'video-editing-6-month',
    6,
    [
      'Adobe Premiere Pro',
      'After Effects',
      'CapCut',
      'DaVinci Resolve',
      'Audio Editing',
    ],
    [
      [
        'Video Editing Foundations',
        [
          'Video formats and resolution',
          'Timeline basics',
          'Cuts and transitions',
          'Audio sync',
          'Color correction basics',
          'Text and titles',
          'Export settings',
          'Social media video formats',
          'CapCut workflow',
          'Mini project: Short social media edit',
        ],
      ],
      [
        'Advanced Editing and Motion Graphics',
        [
          'Adobe Premiere Pro workflow',
          'After Effects basics',
          'Motion graphics intro',
          'Sound design basics',
          'Background music mixing',
          'YouTube video editing',
          'Reels and shorts editing',
          'Client revision workflow',
          'Portfolio building',
          'Final project: Professional promo or YouTube video edit',
        ],
      ],
    ],
  ),
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username:
    process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    const categoryRepo = manager.getRepository(CourseCategory);
    const courseRepo = manager.getRepository(Course);

    const categoryMap = new Map<string, CourseCategory>();
    for (const [index, name] of categories.entries()) {
      const slug = slugify(name);
      let category = await categoryRepo.findOne({ where: { slug } });
      category = await categoryRepo.save(
        categoryRepo.create({
          ...(category ?? {}),
          name,
          slug,
          description: `${name} courses by SystemGrid Academy.`,
          isActive: true,
          sortOrder: index + 1,
        }),
      );
      categoryMap.set(name, category);
    }

    await courseRepo.update(
      { slug: In(['web-development', 'web-development-bootcamp']) },
      { isPublished: false, isFeatured: false },
    );

    for (const [courseIndex, seed] of courses.entries()) {
      const category = categoryMap.get(seed.category);
      let course = await courseRepo.findOne({ where: { slug: seed.slug } });
      course = await courseRepo.save(
        courseRepo.create({
          ...(course ?? {}),
          category,
          title: seed.title,
          slug: seed.slug,
          shortDescription: seed.shortDescription,
          description: seed.description,
          techStack: seed.tools,
          level: seed.level ?? 'beginner',
          duration: seed.durationMonths,
          durationMonths: seed.durationMonths,
          durationLabel: `${seed.durationMonths} Months`,
          durationUnit: 'months',
          mode: 'online',
          language: 'mixed',
          monthlyFee: 5000,
          fee: seed.durationMonths * 5000,
          discountFee: Math.round(seed.durationMonths * 5000 * 0.65),
          isFeatured: courseIndex < 6,
          isPublished: true,
        }),
      );

      await clearCourseOutline(manager, course.id);
      await seedCourseOutline(manager, course, seed);
    }
  });
  await dataSource.destroy();
  console.log(
    `Seeded ${courses.length} SystemGrid Academy courses with quarter-wise curriculum outlines.`,
  );
}

async function clearCourseOutline(
  manager: DataSource['manager'],
  courseId: string,
) {
  await manager.delete(CourseFAQ, { course: { id: courseId } });
  await manager.delete(CourseOutcome, { course: { id: courseId } });
  await manager.delete(CourseProject, { course: { id: courseId } });
  await manager.delete(CourseTool, { course: { id: courseId } });
  await manager.delete(CourseTopic, { course: { id: courseId } });
  await manager.delete(CourseOutlineModule, { course: { id: courseId } });
  await manager.delete(CourseQuarter, { course: { id: courseId } });
}

async function seedCourseOutline(
  manager: DataSource['manager'],
  course: Course,
  seed: CourseSeed,
) {
  for (const [quarterIndex, quarterSeed] of seed.quarters.entries()) {
    const quarter = await manager.save(
      CourseQuarter,
      manager.create(CourseQuarter, {
        course,
        quarterNumber: quarterIndex + 1,
        title: `Quarter ${quarterIndex + 1}`,
        subtitle: quarterSeed.subtitle || quarterSeed.title,
        description: quarterSeed.description || quarterSeed.subtitle,
        durationMonths: 3,
        sortOrder: quarterIndex + 1,
      }),
    );

    for (const [moduleIndex, moduleSeed] of quarterSeed.modules.entries()) {
      const outlineModule = await manager.save(
        CourseOutlineModule,
        manager.create(CourseOutlineModule, {
          course,
          quarter,
          title: moduleSeed.title,
          description:
            moduleSeed.description ??
            `Practical ${moduleSeed.title.toLowerCase()} training with guided tasks and portfolio checkpoints.`,
          sortOrder: moduleIndex + 1,
        }),
      );

      for (const [topicIndex, topicTitle] of moduleSeed.topics.entries()) {
        await manager.save(
          CourseTopic,
          manager.create(CourseTopic, {
            course,
            quarter,
            module: outlineModule,
            title: topicTitle,
            description: topicDescription(topicTitle, moduleSeed.title),
            level: topicLevel(topicTitle, topicIndex, moduleSeed.topics.length),
            sortOrder: topicIndex + 1,
          }),
        );
      }
    }
  }

  await manager.save(
    CourseTool,
    seed.tools.map((name, index) =>
      manager.create(CourseTool, {
        course,
        name,
        type: inferToolType(name),
        icon: slugify(name),
        sortOrder: index + 1,
      }),
    ),
  );

  await manager.save(
    CourseOutcome,
    defaultOutcomes(seed).map((item, index) =>
      manager.create(CourseOutcome, {
        course,
        ...item,
        sortOrder: index + 1,
      }),
    ),
  );

  await manager.save(
    CourseProject,
    seed.quarters.map((quarter, index) =>
      manager.create(CourseProject, {
        course,
        title:
          index === seed.quarters.length - 1
            ? `Final ${seed.title} Project`
            : `${quarter.subtitle || quarter.title} Practical Project`,
        description:
          index === seed.quarters.length - 1
            ? `Build and present a portfolio-ready ${seed.title.toLowerCase()} capstone with review checkpoints.`
            : `Complete a guided project connected to ${quarter.title.toLowerCase()} learning goals.`,
        quarterNumber: index + 1,
        skills: quarter.modules.slice(0, 4).map((item) => item.title),
        sortOrder: index + 1,
      }),
    ),
  );

  await manager.save(
    CourseFAQ,
    defaultFaqs(seed).map((item, index) =>
      manager.create(CourseFAQ, {
        course,
        ...item,
        sortOrder: index + 1,
      }),
    ),
  );
}

function module(title: string, topics: string[]) {
  return { title, topics };
}

function q(title: string, subtitle: string, topics: string[]): QuarterSeed {
  return {
    title: `Quarter`,
    subtitle: title,
    description: subtitle,
    modules: chunk(topics, Math.max(7, Math.ceil(topics.length / 3))).map(
      (items, index) => ({
        title: index === 0 ? title : `${title} - Practice ${index + 1}`,
        topics: items,
      }),
    ),
  };
}

function simpleCourse(
  category: string,
  title: string,
  slug: string,
  durationMonths: number,
  tools: string[],
  quarters: Array<[string, string[]]>,
): CourseSeed {
  return {
    category,
    title,
    slug,
    shortDescription: `${title} training with structured modules, practical work, and portfolio-focused outcomes.`,
    description: `${title} by SystemGrid Academy is a ${durationMonths}-month course built around guided practice, project outcomes, and clear learning checkpoints.`,
    durationMonths,
    tools,
    quarters: quarters.map(([quarterTitle, topics]) =>
      q(
        quarterTitle,
        'Structured learning, guided practice, and project review.',
        topics,
      ),
    ),
  };
}

function stackCourse(
  title: string,
  slug: string,
  shortDescription: string,
  tools: string[],
  quarterTitles: string[],
  quarterTopics: string[][],
): CourseSeed {
  return {
    category: 'Development',
    title,
    slug,
    shortDescription,
    description: `${title} is a nine-month stack-focused path for building and deploying production-style full-stack applications.`,
    durationMonths: 9,
    tools,
    quarters: quarterTitles.map((quarterTitle, index) =>
      q(
        quarterTitle,
        'Stack-focused modules, practical implementation, and final project progress.',
        quarterTopics[index] ?? [],
      ),
    ),
  };
}

function defaultOutcomes(seed: CourseSeed) {
  return [
    {
      title: `Understand ${seed.title} foundations`,
      description:
        'Build strong fundamentals before moving into professional workflows.',
    },
    {
      title: 'Complete practical modules',
      description:
        'Practice each quarter through structured tasks and guided review checkpoints.',
    },
    {
      title: 'Build portfolio-ready projects',
      description:
        'Finish projects that clearly show what you can create and explain.',
    },
    {
      title: 'Prepare for real digital work',
      description:
        'Learn tools, communication habits, and delivery patterns used in professional environments.',
    },
  ];
}

function defaultFaqs(seed: CourseSeed) {
  return [
    {
      question: 'Are classes online?',
      answer:
        'Yes. SystemGrid Academy focuses on live online classes with structured support and practical project guidance.',
    },
    {
      question: 'What is the monthly fee?',
      answer:
        'The monthly fee is PKR 5,000. Quarterly and full-course payment offers are calculated by the backend.',
    },
    {
      question: 'Is there a final project?',
      answer: `Yes. ${seed.title} includes a final portfolio-focused project connected to the course outcomes.`,
    },
    {
      question: 'Can beginners join?',
      answer:
        seed.level === 'intermediate'
          ? 'Basic digital or programming knowledge is recommended for this course.'
          : 'Yes. This course is structured from foundations toward practical project work.',
    },
  ];
}

function topicDescription(topic: string, moduleTitle: string) {
  const topicKey = topic.trim().toLowerCase();
  const detailedDescriptions: Record<string, string> = {
    numpy:
      'Use NumPy arrays for fast numerical calculations, feature matrices, vector operations, and the math layer behind machine-learning datasets.',
    pandas:
      'Clean CSV/Excel data, fix missing values, group records, reshape tables, and prepare real datasets before model training.',
    'scikit-learn':
      'Train practical regression/classification models, split data correctly, tune basics, and read model metrics with confidence.',
    'feature engineering':
      'Convert raw columns into useful model signals such as encoded categories, derived numbers, and cleaned date/text features.',
    'evaluation metrics':
      'Understand accuracy, precision, recall, F1, error values, and when each metric should guide a decision.',
    'react native cli setup':
      'Create a real native project, connect Android/iOS tooling, run emulators/devices, and understand why this track avoids Expo.',
    'react navigation':
      'Build production navigation flows with stacks, tabs, route params, guarded screens, and polished mobile transitions.',
    'api integration with axios':
      'Call backend APIs, handle loading/error states, send auth headers, and organize reusable mobile API services.',
    'tanstack query basics':
      'Cache server data, refresh screens, handle mutations, and keep mobile UI fast without manual state spaghetti.',
    'redux toolkit or zustand':
      'Manage shared app state such as auth, profile, cart, settings, attendance, and fee dashboard data.',
    'excel formulas':
      'Build reusable formulas for cleaning, calculating, and checking business data without manual repetition.',
    'pivot tables':
      'Summarize large sheets into quick reports by product, month, customer, or region.',
    'sql basics':
      'Write queries to fetch exactly the data needed for analysis instead of depending only on exported sheets.',
    joins:
      'Combine related tables such as customers, orders, students, fees, and payments into one useful analysis view.',
    aggregations:
      'Calculate totals, averages, counts, and grouped summaries that power dashboards and reports.',
    'power bi fundamentals':
      'Build interactive dashboards with KPI cards, slicers, charts, and clean report layouts.',
    'data storytelling':
      'Turn charts and numbers into clear business recommendations that non-technical people can understand.',
    'jupyter notebook workflow':
      'Organize code, notes, charts, and findings in one analysis notebook for review and portfolio presentation.',
    'descriptive statistics':
      'Understand mean, median, spread, distribution, and what they reveal about real datasets.',
    'exploratory data analysis':
      'Investigate patterns, trends, outliers, and relationships before building dashboards or models.',
  };
  if (detailedDescriptions[topicKey]) return detailedDescriptions[topicKey];
  if (topicKey.includes('project'))
    return 'Apply the quarter skills in a guided project with review and portfolio preparation.';
  return `Learn ${topic.toLowerCase()} inside the ${moduleTitle} module with examples, practice, and review checkpoints.`;
}

function topicLevel(topic: string, index: number, total: number) {
  const text = topic.toLowerCase();
  if (
    text.includes('final project') ||
    text.includes('mini project') ||
    text.includes('project:')
  )
    return 'project';
  if (index > total * 0.72) return 'advanced';
  if (index > total * 0.38) return 'practice';
  return 'foundation';
}

function inferToolType(name: string) {
  const value = name.toLowerCase();
  if (
    value.includes('api') ||
    value.includes('express') ||
    value.includes('fastapi')
  )
    return 'backend';
  if (
    value.includes('react') ||
    value.includes('next') ||
    value.includes('angular')
  )
    return 'frontend';
  if (
    value.includes('postgres') ||
    value.includes('mongo') ||
    value.includes('sqlite')
  )
    return 'database';
  if (
    value.includes('ads') ||
    value.includes('seo') ||
    value.includes('analytics')
  )
    return 'marketing';
  return 'tool';
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    result.push(items.slice(index, index + size));
  return result;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

seed().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
