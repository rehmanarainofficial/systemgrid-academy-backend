import 'reflect-metadata';
import dataSource from '../data-source';
import { BlogPost, User } from '../entities';
import { UserRole } from '../../common/enums/user-role.enum';

type BlogSeed = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

const posts: BlogSeed[] = [
  {
    title: 'How to Choose Your First IT Course in Pakistan',
    slug: 'choose-first-it-course-pakistan',
    category: 'Career Guide',
    tags: ['career', 'beginner', 'online learning'],
    excerpt:
      'A practical guide for beginners who want to choose a focused IT course and avoid wasting time on scattered tutorials.',
    seoTitle: 'How to Choose Your First IT Course in Pakistan',
    seoDescription:
      'Learn how beginners can choose a practical IT course with real projects, support, and a clear learning path.',
    content: `
## Start with one clear outcome

The best first course is not always the longest course. It is the one that gives you a clear outcome: a small website, a portfolio screen, a landing page, a mobile app flow, or a design case study that you can show.

Beginners often try to learn too many tools at once. A better approach is to select one career direction, understand the required basics, and then build simple projects with feedback.

## Match the course with your current level

If you are new to programming, start with web fundamentals before jumping into advanced frameworks. If you enjoy visuals and product thinking, UI design can be a strong first step. If your goal is freelancing, choose a course that includes client communication, proposals, and project delivery habits.

SystemGrid Academy keeps courses practical by connecting lessons with guided tasks, portfolio work, and review. That helps students move from watching videos to actually building.

## Check the support model

Live online classes are useful when they include structure, assignments, and support. Ask whether the academy gives project guidance, practice tasks, and a way to ask questions after class.

The right course should make your next step obvious. You should know what to practice this week, what to build next, and how your work will be reviewed.
`,
  },
  {
    title: 'Why Portfolio Projects Matter More Than Certificates Alone',
    slug: 'portfolio-projects-vs-certificates',
    category: 'Portfolio',
    tags: ['portfolio', 'projects', 'students'],
    excerpt:
      'Certificates help, but practical portfolio projects show the actual skills employers and clients want to see.',
    seoTitle: 'Why Portfolio Projects Matter More Than Certificates',
    seoDescription:
      'Understand why IT students should build portfolio projects alongside certificates to prove practical skills.',
    content: `
## A certificate explains completion

A certificate can show that a student completed a learning program. It is useful for records and verification, but it does not fully explain how well a student can solve real problems.

That is why portfolio projects are important. A portfolio shows layout decisions, code quality, problem solving, user experience, and the ability to complete a practical task.

## Good projects are focused

A strong beginner project does not need to be huge. It can be a responsive landing page, a dashboard screen, a booking form, a small API-connected feature, or a complete UI case study.

The key is clarity. The project should have a goal, a clean structure, and a short explanation of what was built and why.

## Build, review, improve

Students learn faster when they receive feedback on real work. Review helps improve spacing, responsiveness, accessibility, naming, and project presentation.

SystemGrid Academy encourages students to build presentable projects during the learning path, so the final result is more than notes and screenshots. It becomes proof of skill.
`,
  },
  {
    title: 'A Beginner Roadmap for Web Development Students',
    slug: 'beginner-web-development-roadmap',
    category: 'Web Development',
    tags: ['web development', 'roadmap', 'frontend'],
    excerpt:
      'A simple roadmap for students starting web development, from HTML and CSS basics to practical frontend projects.',
    seoTitle: 'Beginner Web Development Roadmap',
    seoDescription:
      'Follow a practical beginner roadmap for learning web development with HTML, CSS, JavaScript, React, and projects.',
    content: `
## Learn the page first

Start with HTML structure and CSS layout. These are the foundations of every website and application interface. Focus on semantic sections, spacing, typography, responsive grids, and forms.

Once the page feels natural, JavaScript becomes easier because you understand what you are controlling.

## Add interaction carefully

JavaScript should be learned through small interactions: menus, tabs, filters, form validation, and API data rendering. These tasks are closer to real production work than memorizing syntax alone.

After that, React and Next.js make more sense because you can see why components, state, routing, and server data are useful.

## Build complete screens

The most important step is building complete screens. A student should practice headers, forms, cards, dashboards, loading states, empty states, and error states.

SystemGrid Academy teaches web development as a product-building skill, not only as isolated lessons. That is the difference between learning concepts and becoming ready to build real interfaces.
`,
  },
  {
    title: 'How Live Online Classes Help Consistent Learning',
    slug: 'live-online-classes-consistent-learning',
    category: 'Online Learning',
    tags: ['online classes', 'learning habits', 'support'],
    excerpt:
      'Live online classes can improve consistency when they combine schedule, practice, feedback, and project support.',
    seoTitle: 'How Live Online Classes Help Consistent Learning',
    seoDescription:
      'See how structured live online IT classes can help students stay consistent and build practical digital skills.',
    content: `
## Structure creates momentum

Self-learning is powerful, but many beginners struggle because there is no fixed rhythm. Live online classes create a schedule, and a schedule helps students keep moving.

When classes include practice tasks, the learning becomes active. Students are not only listening; they are building and improving.

## Support matters after class

The real questions often appear during practice. A good online learning model gives students a way to get help, review work, and understand mistakes without losing confidence.

That support is especially important for web development, app development, UI design, and freelancing because these skills improve through repeated execution.

## Online does not mean isolated

Online learning works best when it feels connected. Clear tasks, feedback, project milestones, and community support help students stay accountable.

SystemGrid Academy is built around practical online learning with dedicated support, so students can learn from home while still following a structured academy path.
`,
  },
];

function cleanContent(value: string) {
  return value.trim().replace(/\n{3,}/g, '\n\n');
}

async function seedBlogs() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const blogs = dataSource.getRepository(BlogPost);

  const author =
    (await users.findOne({ where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy' } })) ??
    (await users.findOne({ where: { role: UserRole.SuperAdmin } })) ??
    (await users.findOne({ where: { role: UserRole.Admin } }));

  if (!author) {
    throw new Error('No admin or super admin user found. Run the main seed first.');
  }

  for (const item of posts) {
    const existing = await blogs.findOne({ where: { slug: item.slug } });
    await blogs.save(
      blogs.create({
        ...(existing ? { id: existing.id } : {}),
        author,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: cleanContent(item.content),
        category: item.category,
        tags: item.tags,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        isPublished: true,
        publishedAt: existing?.publishedAt ?? new Date(),
      }),
    );
  }

  console.log(`Seeded ${posts.length} published blog posts.`);
  await dataSource.destroy();
}

seedBlogs().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
