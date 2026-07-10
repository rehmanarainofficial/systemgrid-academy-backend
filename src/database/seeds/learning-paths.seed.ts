import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  academyEntities,
  Course,
  LearningPath,
  LearningPathCourse,
  LearningPathOutcome,
  LearningPathPhase,
} from '../entities';

config();

type PhaseSeed = {
  title: string;
  description: string;
  topics: string[];
};

type PathSeed = {
  slug: string;
  title: string;
  badge?: string;
  bestFor: string;
  guidance: string;
  iconKey: string;
  relatedSlugs: string[];
  primaryCourseSlug: string;
  courseSlugs: string[];
  isFeatured?: boolean;
  sortOrder: number;
  phases: PhaseSeed[];
  outcomes: string[];
};

function courseMonths(course: Course) {
  return course.durationMonths ?? course.duration ?? 0;
}

function formatDurationLabel(months: number) {
  return months === 1 ? '1 month' : `${months} months`;
}

function titleCaseLevel(level?: string) {
  if (!level) return 'Beginner';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function enrichPathFromCourses(seed: PathSeed, primaryCourse: Course, linkedCourses: Course[]) {
  const totalMonths = linkedCourses.reduce((sum, course) => sum + courseMonths(course), 0);
  const tools = Array.from(
    new Set(linkedCourses.flatMap((course) => course.techStack ?? [])),
  ).slice(0, 12);

  const linkedTitles = linkedCourses.map((course) => course.title).join(' and ');
  const description =
    linkedCourses.length > 1
      ? `${primaryCourse.description} This roadmap combines ${linkedTitles} into one structured career path at SystemGrid Academy.`
      : primaryCourse.description;

  return {
    ...seed,
    duration: formatDurationLabel(totalMonths),
    level: titleCaseLevel(primaryCourse.level),
    summary: primaryCourse.shortDescription,
    description,
    tools,
  };
}

const webFoundationPhases: PhaseSeed[] = [
  {
    title: 'Foundation',
    description: 'Build a reliable base in layout, programming concepts, and daily development workflow.',
    topics: ['HTML', 'CSS', 'JavaScript basics', 'Git workflow'],
  },
  {
    title: 'Interface Practice',
    description: 'Turn small briefs into responsive UI sections and interactive screens.',
    topics: ['Responsive UI', 'Components', 'Forms', 'Accessibility'],
  },
  {
    title: 'Application Thinking',
    description: 'Connect frontend work with APIs, data, authentication, and dashboard patterns.',
    topics: ['APIs', 'Routing', 'Auth concepts', 'Data states'],
  },
  {
    title: 'Portfolio Project',
    description: 'Complete and present a practical final project with clear structure and outcomes.',
    topics: ['Final build', 'Review', 'Polish', 'Presentation'],
  },
];

const learningPathSeeds: PathSeed[] = [
  {
    slug: 'beginner-web-developer',
    title: 'Beginner to Web Developer',
    badge: 'Popular',
    bestFor: 'Students starting from zero',
    guidance:
      'Choose this path if you are new to programming and want a structured entry into software development.',
    iconKey: 'route',
    relatedSlugs: ['frontend-developer', 'full-stack-developer', 'freelancing'],
    primaryCourseSlug: 'programming-fundamentals',
    courseSlugs: ['programming-fundamentals', 'mern-stack-development'],
    isFeatured: true,
    sortOrder: 1,
    phases: webFoundationPhases,
    outcomes: [
      'Understand modern web development foundations',
      'Build responsive user interfaces',
      'Connect screens with APIs and data',
      'Prepare portfolio-ready project work',
    ],
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend Developer Path',
    bestFor: 'Students who want to build modern websites and UI',
    guidance:
      'Choose this path if you already know basics and want to become strong at modern interfaces.',
    iconKey: 'panels-top-left',
    relatedSlugs: ['beginner-web-developer', 'full-stack-developer', 'ui-ux-graphic-design'],
    primaryCourseSlug: 'mern-stack-development',
    courseSlugs: ['mern-stack-development'],
    sortOrder: 2,
    phases: [
      {
        title: 'UI Foundations',
        description: 'Refine layout, spacing, typography, responsiveness, and interface structure.',
        topics: ['Design systems', 'Responsive layout', 'Typography', 'Accessibility'],
      },
      {
        title: 'React and Next.js',
        description: 'Build reusable components and route-based product interfaces.',
        topics: ['Components', 'App Router', 'State', 'Server/client boundaries'],
      },
      {
        title: 'Production UI',
        description: 'Add forms, loading states, error states, motion, and API-connected screens.',
        topics: ['Forms', 'API integration', 'Loading states', 'Motion'],
      },
      {
        title: 'Frontend Portfolio',
        description: 'Polish a complete UI project and present it with clear case-study thinking.',
        topics: ['UI polish', 'Performance basics', 'Review', 'Presentation'],
      },
    ],
    outcomes: [
      'Create clean component-based interfaces',
      'Work with layouts, forms, and data states',
      'Improve visual quality and responsiveness',
      'Build a frontend portfolio project',
    ],
  },
  {
    slug: 'full-stack-developer',
    title: 'Full Stack Developer Path',
    badge: 'Recommended',
    bestFor: 'Students who want complete web app development skills',
    guidance:
      'Choose this path if you want the broadest software application skill set in one roadmap.',
    iconKey: 'layers-3',
    relatedSlugs: ['frontend-developer', 'mobile-app-developer', 'freelancing'],
    primaryCourseSlug: 'mern-stack-development',
    courseSlugs: ['mern-stack-development', 'django-full-stack-web-development'],
    isFeatured: true,
    sortOrder: 3,
    phases: [
      {
        title: 'Frontend Product UI',
        description: 'Create practical screens for dashboards, forms, tables, and public pages.',
        topics: ['Next.js', 'Layouts', 'Forms', 'Tables'],
      },
      {
        title: 'Backend APIs',
        description: 'Design NestJS modules with DTOs, validation, services, and role-aware endpoints.',
        topics: ['NestJS', 'DTOs', 'Guards', 'Services'],
      },
      {
        title: 'Database and Auth',
        description: 'Connect application logic to PostgreSQL with authentication and protected flows.',
        topics: ['PostgreSQL', 'TypeORM', 'JWT', 'Roles'],
      },
      {
        title: 'Deployment Project',
        description: 'Complete a dashboard-style final project and prepare it for production review.',
        topics: ['Testing basics', 'Docker', 'Deployment', 'Documentation'],
      },
    ],
    outcomes: [
      'Plan and build full-stack features',
      'Create validated backend APIs',
      'Model relational data with PostgreSQL',
      'Build authenticated dashboard workflows',
    ],
  },
  {
    slug: 'mobile-app-developer',
    title: 'Mobile App Developer Path',
    bestFor: 'Students who want Android and iOS app development',
    guidance:
      'Choose this path if you want to build mobile apps and already feel comfortable learning with JavaScript-based tools.',
    iconKey: 'smartphone',
    relatedSlugs: ['full-stack-developer', 'frontend-developer', 'freelancing'],
    primaryCourseSlug: 'app-development-react-native',
    courseSlugs: ['app-development-react-native'],
    sortOrder: 4,
    phases: [
      {
        title: 'Mobile UI Basics',
        description: 'Understand mobile layouts, safe areas, touch targets, and reusable screen structure.',
        topics: ['Mobile layout', 'Components', 'Lists', 'Device sizing'],
      },
      {
        title: 'Navigation and State',
        description: 'Build multi-screen flows with clean state management and validated forms.',
        topics: ['Navigation', 'Forms', 'State', 'Validation'],
      },
      {
        title: 'API-Connected App',
        description: 'Add authentication, data fetching, loading states, and error handling.',
        topics: ['Auth', 'REST APIs', 'Caching', 'Error states'],
      },
      {
        title: 'Final App Polish',
        description: 'Review, test, and present a complete mobile app project.',
        topics: ['Polish', 'Testing basics', 'Build workflow', 'Portfolio'],
      },
    ],
    outcomes: [
      'Build reusable mobile app screens',
      'Create navigation and form flows',
      'Connect mobile apps with APIs',
      'Prepare a portfolio-ready app project',
    ],
  },
  {
    slug: 'ui-ux-graphic-design',
    title: 'UI/UX and Graphic Design Path',
    bestFor: 'Students interested in design, branding, and UI',
    guidance:
      'Choose this path if you are more interested in visual design, branding, product screens, and creative digital work.',
    iconKey: 'palette',
    relatedSlugs: ['frontend-developer', 'freelancing', 'beginner-web-developer'],
    primaryCourseSlug: 'graphic-designing',
    courseSlugs: ['graphic-designing'],
    sortOrder: 5,
    phases: [
      {
        title: 'Visual Foundations',
        description: 'Learn composition, spacing, hierarchy, contrast, and typography fundamentals.',
        topics: ['Composition', 'Spacing', 'Typography', 'Color'],
      },
      {
        title: 'Brand and Marketing Design',
        description: 'Create practical brand assets, social designs, and campaign-ready visuals.',
        topics: ['Branding', 'Social posts', 'Mockups', 'Exports'],
      },
      {
        title: 'UI/UX Basics',
        description: 'Design clean screens with user flow, components, and product presentation in mind.',
        topics: ['Figma', 'Wireframes', 'UI screens', 'Components'],
      },
      {
        title: 'Portfolio Presentation',
        description: 'Curate and present design work with clear rationale and polished visuals.',
        topics: ['Case studies', 'Review', 'Presentation', 'Portfolio'],
      },
    ],
    outcomes: [
      'Improve layout and visual hierarchy',
      'Create brand and campaign assets',
      'Design app and website interface concepts',
      'Package work into a focused portfolio',
    ],
  },
  {
    slug: 'freelancing',
    title: 'Freelancing Career Path',
    bestFor: 'Students who want client work and freelance skills',
    guidance:
      'Choose this path if you already have or are building a skill and want to present and deliver it professionally.',
    iconKey: 'briefcase-business',
    relatedSlugs: ['ui-ux-graphic-design', 'frontend-developer', 'full-stack-developer'],
    primaryCourseSlug: 'digital-marketing',
    courseSlugs: ['digital-marketing'],
    sortOrder: 6,
    phases: [
      {
        title: 'Offer Clarity',
        description: 'Define what you can provide, who it helps, and how to present it honestly.',
        topics: ['Skill audit', 'Services', 'Positioning', 'Proof'],
      },
      {
        title: 'Profile and Portfolio',
        description: 'Create a focused portfolio and profile that communicates practical value.',
        topics: ['Profile', 'Portfolio', 'Case studies', 'Trust signals'],
      },
      {
        title: 'Proposals and Calls',
        description: 'Practice client communication, questions, scope, pricing, and proposal writing.',
        topics: ['Proposals', 'Discovery', 'Pricing', 'Communication'],
      },
      {
        title: 'Delivery Workflow',
        description: 'Use checklists, updates, QA, and handoff practices to deliver professionally.',
        topics: ['Onboarding', 'Updates', 'QA', 'Handoff'],
      },
    ],
    outcomes: [
      'Package your skill into a clear offer',
      'Improve profiles and proposal quality',
      'Communicate scope and timelines clearly',
      'Use a repeatable project delivery workflow',
    ],
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    const courseRepo = manager.getRepository(Course);
    const pathRepo = manager.getRepository(LearningPath);

    for (const seed of learningPathSeeds) {
      const primaryCourse = await courseRepo.findOne({
        where: { slug: seed.primaryCourseSlug, isPublished: true },
      });
      if (!primaryCourse) {
        throw new Error(`Primary course not found for path "${seed.slug}": ${seed.primaryCourseSlug}`);
      }

      const relatedCourses = await Promise.all(
        seed.courseSlugs.map(async (slug) => {
          const course = await courseRepo.findOne({ where: { slug, isPublished: true } });
          if (!course) throw new Error(`Course not found for path "${seed.slug}": ${slug}`);
          return course;
        }),
      );

      let path = await pathRepo.findOne({ where: { slug: seed.slug } });
      const enriched = enrichPathFromCourses(seed, primaryCourse, relatedCourses);
      path = await pathRepo.save(
        pathRepo.create({
          ...(path ?? {}),
          slug: enriched.slug,
          title: enriched.title,
          badge: enriched.badge,
          level: enriched.level,
          duration: enriched.duration,
          bestFor: enriched.bestFor,
          summary: enriched.summary,
          description: enriched.description,
          guidance: enriched.guidance,
          iconKey: enriched.iconKey,
          tools: enriched.tools,
          relatedSlugs: enriched.relatedSlugs,
          primaryCourse,
          isPublished: true,
          isFeatured: enriched.isFeatured ?? false,
          sortOrder: enriched.sortOrder,
        }),
      );

      await manager.delete(LearningPathPhase, { learningPath: { id: path.id } });
      await manager.delete(LearningPathOutcome, { learningPath: { id: path.id } });
      await manager.delete(LearningPathCourse, { learningPath: { id: path.id } });

      await manager.save(
        LearningPathPhase,
        seed.phases.map((phase, index) =>
          manager.create(LearningPathPhase, {
            learningPath: path,
            title: phase.title,
            description: phase.description,
            topics: phase.topics,
            sortOrder: index,
          }),
        ),
      );

      await manager.save(
        LearningPathOutcome,
        seed.outcomes.map((title, index) =>
          manager.create(LearningPathOutcome, {
            learningPath: path,
            title,
            sortOrder: index,
          }),
        ),
      );

      await manager.save(
        LearningPathCourse,
        relatedCourses.map((course, index) =>
          manager.create(LearningPathCourse, {
            learningPath: path,
            course,
            sortOrder: index,
          }),
        ),
      );
    }
  });

  await dataSource.destroy();
  console.log(`Seeded ${learningPathSeeds.length} learning paths with course mappings.`);
}

seed().catch(async (error) => {
  console.error(error);
  await dataSource.destroy();
  process.exit(1);
});
