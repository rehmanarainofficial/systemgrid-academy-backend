import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMernStackCourse1783600000000 implements MigrationInterface {
  name = 'AddMernStackCourse1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check if web development category exists, if not create it
    const categoryResult = await queryRunner.query(
      `SELECT id FROM course_categories WHERE slug = 'web-development' LIMIT 1`
    );
    
    let categoryId: string;
    if (categoryResult.length === 0) {
      const insertCategory = await queryRunner.query(
        `INSERT INTO course_categories (name, slug, description, is_active, sort_order, created_at, updated_at) 
         VALUES ('Web Development', 'web-development', 'Comprehensive web development courses', true, 1, NOW(), NOW()) 
         RETURNING id`
      );
      categoryId = insertCategory[0].id;
    } else {
      categoryId = categoryResult[0].id;
    }

    // Insert MERN Stack course
    const courseResult = await queryRunner.query(
      `INSERT INTO courses (
        category_id, title, slug, short_description, description, 
        level, duration, duration_months, duration_unit, mode, language, 
        fee, discount_fee, is_featured, is_published, tech_stack,
        created_at, updated_at
      ) VALUES (
        $1, 'MERN Stack Development', 'mern-stack-development', 
        'Master full-stack web development with MongoDB, Express, React, and Node.js',
        'Become a job-ready full-stack developer in 9 months. Learn MongoDB, Express, React, Node.js, and modern web development practices through hands-on projects and real-world applications.',
        'intermediate', 36, 9, 'weeks', 'hybrid', 'mixed',
        25000, 20000, true, true,
        ARRAY['MongoDB', 'Express.js', 'React', 'Node.js', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Firebase'],
        NOW(), NOW()
      ) RETURNING id`,
      [categoryId]
    );

    const courseId = courseResult[0].id;

    // Insert course tools
    const tools = [
      { name: 'MongoDB', icon: 'database', sort_order: 1 },
      { name: 'Express.js', icon: 'server', sort_order: 2 },
      { name: 'React', icon: 'layout', sort_order: 3 },
      { name: 'Node.js', icon: 'server', sort_order: 4 },
      { name: 'TypeScript', icon: 'code2', sort_order: 5 },
      { name: 'Next.js', icon: 'layout', sort_order: 6 },
      { name: 'Tailwind CSS', icon: 'layout', sort_order: 7 },
      { name: 'Firebase', icon: 'server', sort_order: 8 },
    ];

    for (const tool of tools) {
      await queryRunner.query(
        `INSERT INTO course_tools (course_id, name, icon, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [courseId, tool.name, tool.icon, tool.sort_order]
      );
    }

    // Insert course outcomes
    const outcomes = [
      { title: 'Build full-stack applications', sort_order: 1 },
      { title: 'Master React and Next.js', sort_order: 2 },
      { title: 'Work with MongoDB and Express', sort_order: 3 },
      { title: 'Deploy applications to production', sort_order: 4 },
      { title: 'Understand RESTful APIs', sort_order: 5 },
      { title: 'Implement authentication and authorization', sort_order: 6 },
      { title: 'Build real-world projects', sort_order: 7 },
      { title: 'Career-ready portfolio', sort_order: 8 },
    ];

    for (const outcome of outcomes) {
      await queryRunner.query(
        `INSERT INTO course_outcomes (course_id, title, sort_order)
         VALUES ($1, $2, $3)`,
        [courseId, outcome.title, outcome.sort_order]
      );
    }

    // Insert course projects
    const projects = [
      { title: 'Portfolio Website', description: 'Personal portfolio with modern design', sort_order: 1 },
      { title: 'E-commerce Platform', description: 'Full-stack shopping application', sort_order: 2 },
      { title: 'Social Media Dashboard', description: 'Real-time analytics dashboard', sort_order: 3 },
      { title: 'Task Management App', description: 'Productivity application with team features', sort_order: 4 },
    ];

    for (const project of projects) {
      await queryRunner.query(
        `INSERT INTO course_projects (course_id, title, description, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [courseId, project.title, project.description, project.sort_order]
      );
    }

    // Insert course FAQs
    const faqs = [
      { question: 'What are the prerequisites for this course?', answer: 'Basic knowledge of HTML, CSS, and JavaScript is recommended but not required.', sort_order: 1 },
      { question: 'How long is the course?', answer: 'The MERN Stack course is 9 months long with flexible scheduling options.', sort_order: 2 },
      { question: 'What projects will I build?', answer: 'You will build 4 major projects including a portfolio website, e-commerce platform, social media dashboard, and task management app.', sort_order: 3 },
      { question: 'Is this course suitable for beginners?', answer: 'Yes, this course is designed for both beginners and intermediate learners looking to master full-stack development.', sort_order: 4 },
      { question: 'What certification will I receive?', answer: 'Upon completion, you will receive an industry-recognized MERN Stack Developer certificate.', sort_order: 5 },
    ];

    for (const faq of faqs) {
      await queryRunner.query(
        `INSERT INTO course_faqs (course_id, question, answer, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [courseId, faq.question, faq.answer, faq.sort_order]
      );
    }

    // Insert course quarters
    const quarters = [
      { quarter_number: 1, title: 'Foundation', subtitle: 'HTML, CSS & JavaScript Fundamentals', duration_months: 2, sort_order: 1 },
      { quarter_number: 2, title: 'Frontend Development', subtitle: 'React & Modern JavaScript', duration_months: 2, sort_order: 2 },
      { quarter_number: 3, title: 'Backend Development', subtitle: 'Node.js & Express', duration_months: 2, sort_order: 3 },
      { quarter_number: 4, title: 'Full Stack Integration', subtitle: 'MERN Stack & Deployment', duration_months: 3, sort_order: 4 },
    ];

    const quarterIds: string[] = [];
    for (const quarter of quarters) {
      const result = await queryRunner.query(
        `INSERT INTO course_quarters (course_id, quarter_number, title, subtitle, duration_months, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [courseId, quarter.quarter_number, quarter.title, quarter.subtitle, quarter.duration_months, quarter.sort_order]
      );
      quarterIds.push(result[0].id);
    }

    // Insert course outline modules and topics
    const modulesByQuarter = [
      {
        quarterId: quarterIds[0],
        modules: [
          { title: 'HTML & CSS Fundamentals', sort_order: 1, topics: [
            { title: 'HTML Basics', description: 'Semantic HTML, document structure', sort_order: 1 },
            { title: 'CSS Fundamentals', description: 'Selectors, box model, colors', sort_order: 2 },
            { title: 'CSS Layout', description: 'Flexbox, grid, responsive design', sort_order: 3 },
            { title: 'Advanced CSS', description: 'Animations, transitions, transforms', sort_order: 4 },
          ]},
          { title: 'JavaScript Basics', sort_order: 2, topics: [
            { title: 'JavaScript Introduction', description: 'Variables, data types, operators', sort_order: 1 },
            { title: 'Control Flow', description: 'Conditionals, loops, functions', sort_order: 2 },
            { title: 'Functions & Arrays', description: 'Function types, array methods', sort_order: 3 },
            { title: 'Objects & DOM', description: 'Object manipulation, DOM handling', sort_order: 4 },
          ]},
        ]
      },
      {
        quarterId: quarterIds[1],
        modules: [
          { title: 'Advanced JavaScript', sort_order: 1, topics: [
            { title: 'ES6+ Features', description: 'Modern JavaScript syntax', sort_order: 1 },
            { title: 'Asynchronous JavaScript', description: 'Promises, async/await', sort_order: 2 },
            { title: 'DOM Manipulation', description: 'Advanced DOM techniques', sort_order: 3 },
            { title: 'Browser APIs', description: 'LocalStorage, geolocation, etc.', sort_order: 4 },
          ]},
          { title: 'TypeScript', sort_order: 2, topics: [
            { title: 'TypeScript Basics', description: 'Types, interfaces, generics', sort_order: 1 },
            { title: 'Advanced TypeScript', description: 'Advanced types and patterns', sort_order: 2 },
            { title: 'TypeScript OOP', description: 'Classes, inheritance, interfaces', sort_order: 3 },
          ]},
          { title: 'React.js', sort_order: 3, topics: [
            { title: 'React Basics', description: 'JSX, components, props, state', sort_order: 1 },
            { title: 'React Hooks', description: 'useState, useEffect, custom hooks', sort_order: 2 },
            { title: 'Advanced React', description: 'Context, Redux, routing', sort_order: 3 },
          ]},
        ]
      },
      {
        quarterId: quarterIds[2],
        modules: [
          { title: 'Next.js', sort_order: 1, topics: [
            { title: 'Next.js Basics', description: 'Pages, routing, optimization', sort_order: 1 },
            { title: 'Data Fetching', description: 'SSR, SSG, API routes', sort_order: 2 },
            { title: 'Advanced Next.js', description: 'Middleware, authentication', sort_order: 3 },
          ]},
          { title: 'Tailwind CSS', sort_order: 2, topics: [
            { title: 'Tailwind Basics', description: 'Utility classes, responsive design', sort_order: 1 },
            { title: 'Advanced Tailwind', description: 'Custom config, components', sort_order: 2 },
          ]},
          { title: 'Node.js', sort_order: 3, topics: [
            { title: 'Node.js Basics', description: 'Modules, file system, events', sort_order: 1 },
            { title: 'HTTP & Networking', description: 'Creating servers, middleware', sort_order: 2 },
            { title: 'Advanced Node.js', description: 'Event loop, performance', sort_order: 3 },
          ]},
        ]
      },
      {
        quarterId: quarterIds[3],
        modules: [
          { title: 'Express.js', sort_order: 1, topics: [
            { title: 'Express Basics', description: 'Routing, middleware, error handling', sort_order: 1 },
            { title: 'Advanced Express', description: 'REST APIs, authentication', sort_order: 2 },
          ]},
          { title: 'MongoDB', sort_order: 2, topics: [
            { title: 'MongoDB Basics', description: 'Documents, collections, CRUD', sort_order: 1 },
            { title: 'Advanced MongoDB', description: 'Aggregation, indexing', sort_order: 2 },
            { title: 'Mongoose ODM', description: 'Schemas, models, validation', sort_order: 3 },
          ]},
          { title: 'Firebase', sort_order: 3, topics: [
            { title: 'Firebase Authentication', description: 'Auth providers, session management', sort_order: 1 },
            { title: 'Firebase Database', description: 'Firestore, realtime database', sort_order: 2 },
            { title: 'Firebase Services', description: 'Storage, hosting, functions', sort_order: 3 },
          ]},
          { title: 'Redux', sort_order: 4, topics: [
            { title: 'Redux Basics', description: 'Store, actions, reducers', sort_order: 1 },
            { title: 'Advanced Redux', description: 'Thunk, toolkit, patterns', sort_order: 2 },
          ]},
        ]
      },
    ];

    for (const quarterData of modulesByQuarter) {
      for (const module of quarterData.modules) {
        const moduleResult = await queryRunner.query(
          `INSERT INTO course_outline_modules (course_id, quarter_id, title, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [courseId, quarterData.quarterId, module.title, module.sort_order]
        );

        const moduleId = moduleResult[0].id;

        for (const topic of module.topics) {
          await queryRunner.query(
            `INSERT INTO course_topics (course_id, quarter_id, module_id, title, description, sort_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [courseId, quarterData.quarterId, moduleId, topic.title, topic.description, topic.sort_order]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the MERN course and all related data
    await queryRunner.query(`DELETE FROM course_topics WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_outline_modules WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_quarters WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_faqs WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_projects WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_outcomes WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM course_tools WHERE course_id IN (SELECT id FROM courses WHERE slug = 'mern-stack-development')`);
    await queryRunner.query(`DELETE FROM courses WHERE slug = 'mern-stack-development'`);
  }
}
