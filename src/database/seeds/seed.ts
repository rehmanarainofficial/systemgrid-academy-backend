import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  academyEntities,
  Assignment,
  AssignmentSubmission,
  Attendance,
  AuditLog,
  Batch,
  Certificate,
  ClassSchedule,
  Course,
  CourseCategory,
  CourseModule,
  CourseResource,
  Enrollment,
  FeePlan,
  Instructor,
  Invoice,
  Lesson,
  Lead,
  Notification,
  Payment,
  Setting,
  StudentProfile,
  User,
} from '../entities';

config();

const ACADEMY_PHONE = '03433133834';
const ACADEMY_PHONE_INTL = '+923433133834';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username:
    process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password:
    process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const studentProfiles = dataSource.getRepository(StudentProfile);
  const categories = dataSource.getRepository(CourseCategory);
  const courses = dataSource.getRepository(Course);
  const modules = dataSource.getRepository(CourseModule);
  const lessons = dataSource.getRepository(Lesson);
  const batches = dataSource.getRepository(Batch);
  const enrollments = dataSource.getRepository(Enrollment);
  const schedules = dataSource.getRepository(ClassSchedule);
  const attendance = dataSource.getRepository(Attendance);
  const assignments = dataSource.getRepository(Assignment);
  const submissions = dataSource.getRepository(AssignmentSubmission);
  const feePlans = dataSource.getRepository(FeePlan);
  const payments = dataSource.getRepository(Payment);
  const invoices = dataSource.getRepository(Invoice);
  const certificates = dataSource.getRepository(Certificate);
  const notifications = dataSource.getRepository(Notification);
  const leads = dataSource.getRepository(Lead);
  const resources = dataSource.getRepository(CourseResource);
  const instructors = dataSource.getRepository(Instructor);
  const settings = dataSource.getRepository(Setting);
  const auditLogs = dataSource.getRepository(AuditLog);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy';
  const existingAdmin = await users.findOne({ where: { email: adminEmail } });
  await users.save(
    existingAdmin
      ? users.merge(existingAdmin, {
          name: process.env.SEED_ADMIN_NAME ?? 'SystemGrid Admin',
          password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123', 12),
          role: UserRole.Admin,
          isActive: true,
        })
      : users.create({
          name: process.env.SEED_ADMIN_NAME ?? 'SystemGrid Admin',
          email: adminEmail,
          password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123', 12),
          role: UserRole.Admin,
          isActive: true,
        }),
  );

  for (const account of [
    {
      name: 'SystemGrid Super Admin',
      email: 'superadmin@systemgrid.academy',
      password: 'SuperAdmin@123',
      role: UserRole.SuperAdmin,
    },
    {
      name: 'Admissions Staff',
      email: 'staff@systemgrid.academy',
      password: 'Staff@123',
      role: UserRole.Staff,
    },
  ]) {
    const existing = await users.findOne({ where: { email: account.email } });
    await users.save(
      existing
        ? users.merge(existing, {
            name: account.name,
            password: await bcrypt.hash(account.password, 12),
            role: account.role,
            isActive: true,
          })
        : users.create({
            ...account,
            password: await bcrypt.hash(account.password, 12),
            isActive: true,
          }),
    );
  }

  const categoryNames = ['Web Development', 'App Development', 'Desktop App Development', 'Graphic Designing', 'English for IT', 'AI and Automation', 'Data', 'Freelancing'];
  for (const [index, name] of categoryNames.entries()) {
    const slug = name.toLowerCase().replaceAll(' ', '-');
    let category = await categories.findOne({ where: { slug } });
    if (!category) {
      category = await categories.save(
        categories.create({
          name,
          slug,
          description: `${name} courses by SystemGrid Academy`,
          sortOrder: index + 1,
        }),
      );
    }

    const sampleSlug = `${slug}-foundation`;
    const existingCourse = await courses.findOne({ where: { slug: sampleSlug } });
    if (!existingCourse) {
      await courses.save(
        courses.create({
          category,
          title: `${name} Foundation`,
          slug: sampleSlug,
          shortDescription: `Beginner-friendly ${name.toLowerCase()} course with practical projects.`,
          duration: 12,
          durationUnit: 'weeks',
          mode: 'hybrid',
          language: 'mixed',
          fee: 25000,
          discountFee: 20000,
          isFeatured: index < 2,
          isPublished: true,
        }),
      );
    }
  }

  let studentUser = await users.findOne({
    where: { email: 'student@systemgrid.academy' },
  });
  if (!studentUser) {
    studentUser = await users.save(
      users.create({
        name: 'SystemGrid Student',
        email: 'student@systemgrid.academy',
        password: await bcrypt.hash('Student@123', 12),
        role: UserRole.Student,
        phone: ACADEMY_PHONE_INTL,
        isActive: true,
      }),
    );
  }

  let studentProfile = await studentProfiles.findOne({
    where: { user: { id: studentUser.id } },
    relations: { user: true },
  });
  if (!studentProfile) {
    studentProfile = await studentProfiles.save(
      studentProfiles.create({
        user: studentUser,
        guardianName: 'Guardian',
        guardianPhone: ACADEMY_PHONE_INTL,
        address: 'Karachi, Pakistan',
        city: 'Karachi',
        educationLevel: 'intermediate',
        source: 'walk_in',
        status: 'active',
      }),
    );
  } else {
    await studentProfiles.save(
      studentProfiles.merge(studentProfile, {
        guardianName: studentProfile.guardianName ?? 'Guardian',
        guardianPhone: studentProfile.guardianPhone ?? ACADEMY_PHONE_INTL,
        address: studentProfile.address ?? 'Karachi, Pakistan',
        city: studentProfile.city ?? 'Karachi',
        educationLevel: studentProfile.educationLevel ?? 'intermediate',
      }),
    );
  }

  const webCategory = await categories.findOne({
    where: { slug: 'web-development' },
  });
  const appCategory = await categories.findOne({
    where: { slug: 'app-development' },
  });

  const webCourse =
    (await courses.findOne({ where: { slug: 'web-development-bootcamp' } })) ??
    (await courses.save(
      courses.create({
        category: webCategory ?? undefined,
        title: 'Web Development Bootcamp',
        slug: 'web-development-bootcamp',
        shortDescription:
          'Learn frontend, backend, database, dashboard, and deployment through real projects.',
        description:
          'A project-focused path for building production-ready web applications with modern tools.',
        level: 'beginner',
        duration: 6,
        durationUnit: 'months',
        mode: 'hybrid',
        language: 'mixed',
        fee: 42000,
        discountFee: 42000,
        isFeatured: true,
        isPublished: true,
      }),
    ));
  await courses.update({ slug: 'web-development-bootcamp' }, { isPublished: false, isFeatured: false });

  const appCourse =
    (await courses.findOne({ where: { slug: 'app-development-bootcamp' } })) ??
    (await courses.save(
      courses.create({
        category: appCategory ?? undefined,
        title: 'App Development Bootcamp',
        slug: 'app-development-bootcamp',
        shortDescription:
          'Build Android and iOS app interfaces, APIs, authentication, and real-world app flows.',
        description:
          'A practical app development path with UI, API integration, and deployment basics.',
        level: 'beginner',
        duration: 5,
        durationUnit: 'months',
        mode: 'hybrid',
        language: 'mixed',
        fee: 38000,
        discountFee: 35000,
        isFeatured: true,
        isPublished: true,
      }),
    ));

  const additionalCourseSeeds = [
    {
      categorySlug: 'desktop-app-development',
      title: 'Desktop App Development',
      slug: 'desktop-app-development',
      shortDescription: 'Build professional desktop applications with modern UI, local data, and APIs.',
      fee: 36000,
    },
    {
      categorySlug: 'graphic-designing',
      title: 'Graphic Designing',
      slug: 'graphic-designing',
      shortDescription: 'Learn brand design, social media graphics, layout, and portfolio presentation.',
      fee: 28000,
    },
    {
      categorySlug: 'english-for-it',
      title: 'English for IT',
      slug: 'english-for-it',
      shortDescription: 'Improve technical communication, interview speaking, and workplace English.',
      fee: 18000,
    },
    {
      categorySlug: 'ai-and-automation',
      title: 'AI and Automation',
      slug: 'ai-and-automation',
      shortDescription: 'Use practical AI tools and automation workflows for real business tasks.',
      fee: 32000,
    },
    {
      categorySlug: 'data',
      title: 'Data Science and Analytics',
      slug: 'data-science-and-analytics',
      shortDescription: 'Master Python, statistics, dashboards, machine learning, and data portfolio projects.',
      fee: 60000,
    },
    {
      categorySlug: 'data',
      title: 'Data Analysis',
      slug: 'data-analysis',
      shortDescription: 'Learn Excel, SQL, Python, dashboards, reporting, and practical business analysis.',
      fee: 30000,
    },
    {
      categorySlug: 'freelancing',
      title: 'Freelancing',
      slug: 'freelancing',
      shortDescription: 'Learn profiles, proposals, client communication, pricing, and delivery workflows.',
      fee: 22000,
    },
  ];

  for (const courseSeed of additionalCourseSeeds) {
    const category = await categories.findOne({ where: { slug: courseSeed.categorySlug } });
    const existingCourse = await courses.findOne({ where: { slug: courseSeed.slug } });
    if (!existingCourse) {
      await courses.save(
        courses.create({
          category: category ?? undefined,
          title: courseSeed.title,
          slug: courseSeed.slug,
          shortDescription: courseSeed.shortDescription,
          description: `${courseSeed.title} training by SystemGrid Academy with practical tasks and portfolio-focused outcomes.`,
          level: 'beginner',
          duration: 12,
          durationUnit: 'weeks',
          mode: 'hybrid',
          language: 'mixed',
          fee: courseSeed.fee,
          discountFee: courseSeed.fee,
          isFeatured: ['desktop-app-development', 'ai-and-automation'].includes(courseSeed.slug),
          isPublished: true,
        }),
      );
    }
  }

  const webModuleSeeds = [
    {
      title: 'HTML, CSS, and Layout Fundamentals',
      description:
        'Learn page structure, styling, responsive layout, Flexbox, Grid, and modern UI basics.',
      lessons: ['HTML Structure', 'Responsive CSS', 'Flexbox and Grid'],
    },
    {
      title: 'React and Next.js App Router',
      description:
        'Build reusable components, route groups, layouts, and production-ready screens.',
      lessons: ['React Components', 'Next.js App Router', 'Dynamic Routes and Layouts'],
    },
    {
      title: 'Backend, Database, and Deployment',
      description:
        'Connect APIs, PostgreSQL data, authentication, and deployment workflows.',
      lessons: ['NestJS APIs', 'PostgreSQL Relations', 'Deployment Checklist'],
    },
  ];

  for (const [moduleIndex, moduleSeed] of webModuleSeeds.entries()) {
    let courseModule = await modules.findOne({
      where: { course: { id: webCourse.id }, title: moduleSeed.title },
      relations: { course: true },
    });
    if (!courseModule) {
      courseModule = await modules.save(
        modules.create({
          course: webCourse,
          title: moduleSeed.title,
          description: moduleSeed.description,
          sortOrder: moduleIndex + 1,
        }),
      );
    }

    for (const [lessonIndex, lessonTitle] of moduleSeed.lessons.entries()) {
      const sortOrder = moduleIndex * 10 + lessonIndex + 1;
      const existingLesson = await lessons.findOne({
        where: { course: { id: webCourse.id }, title: lessonTitle },
        relations: { course: true },
      });
      if (!existingLesson) {
        await lessons.save(
          lessons.create({
            course: webCourse,
            module: courseModule,
            title: lessonTitle,
            description: `Practice ${lessonTitle.toLowerCase()} through a guided SystemGrid Academy task.`,
            videoUrl: '',
            resourceUrl: '',
            durationMinutes: 35 + lessonIndex * 10,
            sortOrder,
            isPublished: true,
          }),
        );
      }
    }
  }

  const instructorSeeds = [
    {
      name: 'Ahsan Rehman',
      email: 'ahsan.instructor@systemgrid.academy',
      phone: ACADEMY_PHONE_INTL,
      specialization: 'Full Stack Web Development',
      bio: 'Instructor record for SystemGrid Academy web and dashboard classes.',
    },
    {
      name: 'Sara Khan',
      email: 'sara.instructor@systemgrid.academy',
      phone: ACADEMY_PHONE_INTL,
      specialization: 'Design and Communication',
      bio: 'Instructor record for design, portfolio, and communication training.',
    },
  ];

  const seededInstructors: Instructor[] = [];
  for (const instructorSeed of instructorSeeds) {
    const existingInstructor = await instructors.findOne({ where: { email: instructorSeed.email } });
    seededInstructors.push(
      existingInstructor ??
        (await instructors.save(
          instructors.create({
            ...instructorSeed,
            isActive: true,
          }),
        )),
    );
  }

  let batch = await batches.findOne({ where: { code: 'WEB-2026-EVE' } });
  if (!batch) {
    batch = await batches.save(
      batches.create({
        course: webCourse,
        instructor: seededInstructors[0],
        title: 'Evening Batch',
        code: 'WEB-2026-EVE',
        startDate: '2026-07-05',
        endDate: '2026-12-20',
        classDays: ['Monday', 'Wednesday', 'Friday'],
        startTime: '20:00',
        endTime: '22:00',
        mode: 'online',
        capacity: 25,
        status: 'active',
      }),
    );
  } else if (!batch.instructor && seededInstructors[0]) {
    batch.instructor = seededInstructors[0];
    await batches.save(batch);
  }

  let enrollment = await enrollments.findOne({
    where: { student: { id: studentProfile.id }, course: { id: webCourse.id } },
    relations: { student: true, course: true, batch: true },
  });
  if (!enrollment) {
    enrollment = await enrollments.save(
      enrollments.create({
        student: studentProfile,
        course: webCourse,
        batch,
        status: 'active',
        progressPercentage: 72,
      }),
    );
  }

  let appEnrollment = await enrollments.findOne({
    where: { student: { id: studentProfile.id }, course: { id: appCourse.id } },
    relations: { student: true, course: true },
  });
  if (!appEnrollment) {
    appEnrollment = await enrollments.save(
      enrollments.create({
        student: studentProfile,
        course: appCourse,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
      }),
    );
  }

  const leadSeeds = [
    ['Ali Raza', 'ali.raza@example.com', ACADEMY_PHONE, 'Karachi', 'Web Development', 'free_demo_class_page', 'new'],
    ['Hira Khan', 'hira.khan@example.com', ACADEMY_PHONE, 'Lahore', 'Graphic Designing', 'admissions_page', 'contacted'],
    ['Usman Tariq', 'usman.tariq@example.com', ACADEMY_PHONE, 'Islamabad', 'App Development', 'course_detail_page', 'converted'],
    ['Areeba Ahmed', 'areeba.ahmed@example.com', ACADEMY_PHONE, 'Karachi', 'English for IT', 'contact_page', 'new'],
    ['Hamza Shah', 'hamza.shah@example.com', ACADEMY_PHONE, 'Hyderabad', 'Web Development', 'website', 'contacted'],
    ['Maham Noor', 'maham.noor@example.com', ACADEMY_PHONE, 'Rawalpindi', 'App Development', 'free_demo_class_page', 'new'],
    ['Saad Malik', 'saad.malik@example.com', ACADEMY_PHONE, 'Multan', 'Web Development', 'admissions_page', 'rejected'],
    ['Iqra Fatima', 'iqra.fatima@example.com', ACADEMY_PHONE, 'Faisalabad', 'Graphic Designing', 'website', 'contacted'],
    ['Daniyal Qureshi', 'daniyal.q@example.com', ACADEMY_PHONE, 'Karachi', 'App Development', 'course_detail_page', 'new'],
    ['Zoya Siddiqui', 'zoya.s@example.com', ACADEMY_PHONE, 'Peshawar', 'English for IT', 'contact_page', 'converted'],
  ] as const;

  for (const [name, email, phone, city, courseInterest, source, status] of leadSeeds) {
    const existing = await leads.findOne({ where: { email } });
    if (!existing) {
      await leads.save(
        leads.create({
          name,
          email,
          phone,
          city,
          courseInterest,
          source,
          status,
          preferredMode: source === 'free_demo_class_page' ? 'online' : 'hybrid',
          preferredTiming: 'Evening',
          studentLevel: 'beginner',
          message: `I would like guidance about ${courseInterest}.`,
        }),
      );
    }
  }

  const studentSeeds = [
    ['Ayesha Noor', 'ayesha.noor@student.test', ACADEMY_PHONE, 'Karachi', 'active'],
    ['Bilal Ahmed', 'bilal.ahmed@student.test', ACADEMY_PHONE, 'Lahore', 'active'],
    ['Eman Ali', 'eman.ali@student.test', ACADEMY_PHONE, 'Islamabad', 'active'],
    ['Fahad Khan', 'fahad.khan@student.test', ACADEMY_PHONE, 'Karachi', 'inactive'],
    ['Ghazal Malik', 'ghazal.malik@student.test', ACADEMY_PHONE, 'Multan', 'active'],
    ['Hassan Raza', 'hassan.raza@student.test', ACADEMY_PHONE, 'Hyderabad', 'graduated'],
    ['Inaya Tariq', 'inaya.tariq@student.test', ACADEMY_PHONE, 'Faisalabad', 'active'],
    ['Junaid Shah', 'junaid.shah@student.test', ACADEMY_PHONE, 'Peshawar', 'dropped'],
    ['Komal Fatima', 'komal.fatima@student.test', ACADEMY_PHONE, 'Rawalpindi', 'active'],
  ] as const;

  for (const [name, email, phone, city, status] of studentSeeds) {
    let user = await users.findOne({ where: { email } });
    if (!user) {
      user = await users.save(
        users.create({
          name,
          email,
          phone,
          password: await bcrypt.hash('Student@123', 12),
          role: UserRole.Student,
          isActive: status === 'active',
        }),
      );
    }
    let profile = await studentProfiles.findOne({
      where: { user: { id: user.id } },
      relations: { user: true },
    });
    if (!profile) {
      profile = await studentProfiles.save(
        studentProfiles.create({
          user,
          city,
          guardianName: `${name.split(' ')[0]} Guardian`,
          guardianPhone: phone,
          educationLevel: 'intermediate',
          source: 'admin',
          status,
        }),
      );
    }
    let seededEnrollment = await enrollments.findOne({
      where: { student: { id: profile.id }, course: { id: webCourse.id } },
      relations: { student: true, course: true },
    });
    if (!seededEnrollment) {
      seededEnrollment = await enrollments.save(
        enrollments.create({
          student: profile,
          course: webCourse,
          batch,
          status: status === 'active' ? 'active' : status === 'graduated' ? 'completed' : 'dropped',
          progressPercentage: status === 'graduated' ? 100 : status === 'active' ? 35 : 12,
        }),
      );
    }
    const existingPlan = await feePlans.findOne({
      where: { enrollment: { id: seededEnrollment.id } },
      relations: { enrollment: true },
    });
    if (!existingPlan) {
      const pendingAmount = status === 'graduated' ? 0 : status === 'active' ? 12000 : 22000;
      await feePlans.save(
        feePlans.create({
          enrollment: seededEnrollment,
          totalAmount: 42000,
          discountAmount: 2000,
          payableAmount: 40000,
          paidAmount: 40000 - pendingAmount,
          pendingAmount,
          installmentType: 'monthly',
          dueDate: '2026-07-15',
          status: pendingAmount === 0 ? 'paid' : 'partial',
        }),
      );
    }
    const existingAttendance = await attendance.findOne({
      where: { student: { id: profile.id }, batch: { id: batch.id }, date: '2026-06-20' },
      relations: { student: true, batch: true },
    });
    if (!existingAttendance) {
      await attendance.save(
        attendance.create({
          student: profile,
          batch,
          course: webCourse,
          date: '2026-06-20',
          status: status === 'active' || status === 'graduated' ? 'present' : 'absent',
        }),
      );
    }
  }

  const webLessons = await lessons.find({
    where: { course: { id: webCourse.id }, isPublished: true },
    relations: { course: true, module: true },
    order: { sortOrder: 'ASC' },
  });

  const scheduleSeeds = [
    ['2026-07-05', webLessons[5], 'upcoming'],
    ['2026-07-08', webLessons[6], 'upcoming'],
    ['2026-07-10', webLessons[7], 'upcoming'],
    ['2026-07-12', webLessons[8], 'upcoming'],
  ] as const;

  for (const [date, lesson, status] of scheduleSeeds) {
    const existingSchedule = await schedules.findOne({
      where: { batch: { id: batch.id }, date },
      relations: { batch: true },
    });
    if (!existingSchedule) {
      await schedules.save(
        schedules.create({
          batch,
          course: webCourse,
          lesson: lesson ?? undefined,
          date,
          startTime: '20:00',
          endTime: '22:00',
          mode: 'online',
          meetingUrl: 'https://meet.google.com/systemgrid-academy-demo',
          location: 'Online Class',
          status,
        }),
      );
    }
  }

  const attendanceDates = [
    ['2026-06-01', 'present'],
    ['2026-06-03', 'present'],
    ['2026-06-05', 'late'],
    ['2026-06-08', 'present'],
    ['2026-06-10', 'absent'],
    ['2026-06-12', 'leave'],
    ['2026-06-15', 'present'],
    ['2026-06-17', 'present'],
    ['2026-06-19', 'present'],
    ['2026-06-22', 'present'],
    ['2026-06-24', 'present'],
    ['2026-06-26', 'present'],
    ['2026-06-29', 'present'],
    ['2026-07-01', 'present'],
  ] as const;

  for (const [date, status] of attendanceDates) {
    const existingAttendance = await attendance.findOne({
      where: { student: { id: studentProfile.id }, batch: { id: batch.id }, date },
      relations: { student: true, batch: true },
    });
    if (!existingAttendance) {
      await attendance.save(
        attendance.create({
          student: studentProfile,
          batch,
          course: webCourse,
          date,
          status,
          remarks:
            status === 'absent'
              ? 'Missed class'
              : status === 'late'
                ? 'Joined after class start'
                : '',
        }),
      );
    }
  }

  const webModules = await modules.find({
    where: { course: { id: webCourse.id } },
    relations: { course: true },
    order: { sortOrder: 'ASC' },
  });
  const assignmentSeeds = [
    {
      title: 'Build Responsive Landing Page',
      description:
        'Create a premium responsive landing page using Next.js, Tailwind CSS, and reusable components.',
      module: webModules[1] ?? webModules[0],
      dueDate: '2026-07-10T20:00:00.000Z',
      totalMarks: 100,
      attachmentUrl: '',
      submission: null,
    },
    {
      title: 'React Components Practice',
      description:
        'Build reusable cards, badges, and layout components for a learning dashboard.',
      module: webModules[1] ?? webModules[0],
      dueDate: '2026-07-01T20:00:00.000Z',
      totalMarks: 80,
      attachmentUrl: '',
      submission: {
        textAnswer: 'Completed component practice and shared the repository link.',
        fileUrl: 'https://example.com/react-components-practice',
        status: 'submitted',
      },
    },
    {
      title: 'HTML CSS Layout Task',
      description:
        'Create a clean responsive layout with semantic HTML, modern spacing, and accessible sections.',
      module: webModules[0],
      dueDate: '2026-06-24T20:00:00.000Z',
      totalMarks: 100,
      attachmentUrl: '',
      submission: {
        textAnswer: 'Submitted responsive HTML and CSS layout task.',
        fileUrl: 'https://example.com/html-css-layout-task',
        status: 'checked',
        marksObtained: 85,
        feedback: 'Good work. Improve spacing and responsive details.',
        checkedAt: new Date('2026-06-26T12:00:00.000Z'),
      },
    },
  ] as const;

  for (const assignmentSeed of assignmentSeeds) {
    let assignment = await assignments.findOne({
      where: { course: { id: webCourse.id }, title: assignmentSeed.title },
      relations: { course: true },
    });
    if (!assignment) {
      assignment = await assignments.save(
        assignments.create({
          course: webCourse,
          batch,
          module: assignmentSeed.module,
          title: assignmentSeed.title,
          description: assignmentSeed.description,
          dueDate: new Date(assignmentSeed.dueDate),
          totalMarks: assignmentSeed.totalMarks,
          attachmentUrl: assignmentSeed.attachmentUrl,
          isPublished: true,
        }),
      );
    }

    if (assignmentSeed.submission) {
      const existingSubmission = await submissions.findOne({
        where: {
          assignment: { id: assignment.id },
          student: { id: studentProfile.id },
        },
        relations: { assignment: true, student: true },
      });
      if (!existingSubmission) {
        await submissions.save(
          submissions.create({
            assignment,
            student: studentProfile,
            textAnswer: assignmentSeed.submission.textAnswer,
            fileUrl: assignmentSeed.submission.fileUrl,
            status: assignmentSeed.submission.status,
            marksObtained:
              'marksObtained' in assignmentSeed.submission
                ? assignmentSeed.submission.marksObtained
                : undefined,
            feedback:
              'feedback' in assignmentSeed.submission
                ? assignmentSeed.submission.feedback
                : undefined,
            checkedAt:
              'checkedAt' in assignmentSeed.submission
                ? assignmentSeed.submission.checkedAt
                : undefined,
          }),
        );
      }
    }
  }

  const existingFeePlan = await feePlans.findOne({
    where: { enrollment: { id: enrollment.id } },
    relations: { enrollment: true },
  });
  const mainFeePlan = await feePlans.save(
    existingFeePlan
      ? feePlans.merge(existingFeePlan, {
          totalAmount: 42000,
          discountAmount: 3000,
          payableAmount: 39000,
          paidAmount: 30000,
          pendingAmount: 9000,
          installmentType: 'monthly',
          dueDate: '2026-07-10',
          status: 'partial',
        })
      : feePlans.create({
          enrollment,
          totalAmount: 42000,
          discountAmount: 3000,
          payableAmount: 39000,
          paidAmount: 30000,
          pendingAmount: 9000,
          installmentType: 'monthly',
          dueDate: '2026-07-10',
          status: 'partial',
        }),
  );

  const paymentSeeds = [
    {
      invoiceNumber: 'SGA-INV-0001',
      amount: 15000,
      method: 'cash',
      paymentDate: '2026-06-15',
      notes: 'First installment received at office.',
    },
    {
      invoiceNumber: 'SGA-INV-0002',
      amount: 15000,
      method: 'bank_transfer',
      paymentDate: '2026-06-28',
      notes: 'Second installment verified by accounts.',
    },
  ] as const;

  for (const paymentSeed of paymentSeeds) {
    let payment = await payments.findOne({
      where: {
        enrollment: { id: enrollment.id },
        student: { id: studentProfile.id },
        paymentDate: paymentSeed.paymentDate,
      },
      relations: { enrollment: true, student: true },
    });
    if (!payment) {
      payment = await payments.save(
        payments.create({
          student: studentProfile,
          enrollment,
          feePlan: mainFeePlan,
          amount: paymentSeed.amount,
          method: paymentSeed.method,
          paymentDate: paymentSeed.paymentDate,
          status: 'verified',
          notes: paymentSeed.notes,
        }),
      );
    }

    const existingInvoice = await invoices.findOne({
      where: { invoiceNumber: paymentSeed.invoiceNumber },
    });
    if (!existingInvoice) {
      await invoices.save(
        invoices.create({
          payment,
          invoiceNumber: paymentSeed.invoiceNumber,
          amount: paymentSeed.amount,
          status: 'paid',
          pdfUrl: '',
        }),
      );
    }
  }

  const existingCertificate = await certificates.findOne({
    where: { certificateNumber: 'SGA-CERT-0001' },
  });
  if (!existingCertificate) {
    await certificates.save(
      certificates.create({
        student: studentProfile,
        course: appCourse,
        enrollment: appEnrollment,
        certificateNumber: 'SGA-CERT-0001',
        verificationCode: 'SGA-VERIFY-12345',
        issueDate: '2026-07-01',
        pdfUrl: '',
        status: 'issued',
      }),
    );
  }

  const notificationSeeds = [
    {
      title: 'Class timing updated',
      message:
        'Your Web Development Bootcamp class timing has been updated for Friday.',
      type: 'class',
      isRead: false,
      actionUrl: '/student/schedule',
    },
    {
      title: 'Fee installment reminder',
      message: 'Your next fee installment is due soon. Please review your fee plan.',
      type: 'fee',
      isRead: false,
      actionUrl: '/student/payments',
    },
    {
      title: 'Assignment published',
      message: 'A new assignment has been published for your current batch.',
      type: 'assignment',
      isRead: true,
      actionUrl: '/student/assignments',
    },
    {
      title: 'Certificate issued',
      message: 'Your certificate is now available in the student portal.',
      type: 'certificate',
      isRead: true,
      actionUrl: '/student/certificates',
    },
    {
      title: 'Payment verified',
      message: 'Your recent payment has been verified by the academy team.',
      type: 'payment',
      isRead: true,
      actionUrl: '/student/payments',
    },
  ] as const;

  for (const notificationSeed of notificationSeeds) {
    const existingNotification = await notifications.findOne({
      where: { user: { id: studentUser.id }, title: notificationSeed.title },
      relations: { user: true },
    });
    if (!existingNotification) {
      await notifications.save(
        notifications.create({
          user: studentUser,
          title: notificationSeed.title,
          message: notificationSeed.message,
          type: notificationSeed.type,
          isRead: notificationSeed.isRead,
          actionUrl: notificationSeed.actionUrl,
        }),
      );
    } else {
      await notifications.save(
        notifications.merge(existingNotification, {
          message: notificationSeed.message,
          type: notificationSeed.type,
          isRead: notificationSeed.isRead,
          actionUrl: notificationSeed.actionUrl,
        }),
      );
    }
  }

  const existingResource = await resources.findOne({
    where: { course: { id: webCourse.id }, title: 'Course Roadmap PDF' },
    relations: { course: true },
  });
  if (!existingResource) {
    await resources.save(
      resources.create({
        course: webCourse,
        title: 'Course Roadmap PDF',
        type: 'pdf',
        url: '/resources/web-roadmap.pdf',
      }),
    );
  }

  const settingSeeds = [
    {
      key: 'branding',
      value: {
        academyName: 'SystemGrid Academy',
        tagline: 'Practical IT Training by SystemGrid',
        logoUrl: '/logo.svg',
      },
    },
    {
      key: 'contact',
      value: {
        supportEmail: 'support@thesystemgrid.com',
        academyEmail: 'academy@thesystemgrid.com',
        city: 'Karachi',
        website: 'https://academy.thesystemgrid.com',
      },
    },
    {
      key: 'theme',
      value: {
        defaultTheme: 'system',
        primaryColor: '#007AFF',
        accentColor: '#0EA5E9',
      },
    },
    {
      key: 'whatsapp',
      value: {
        number: '923433133834',
        enabled: true,
        message: 'Assalam o Alaikum, I want to know more about SystemGrid Academy.',
      },
    },
  ];

  for (const settingSeed of settingSeeds) {
    const existingSetting = await settings.findOne({ where: { key: settingSeed.key } });
    await settings.save(existingSetting ? settings.merge(existingSetting, { value: settingSeed.value }) : settings.create(settingSeed));
  }

  const superAdmin = await users.findOne({ where: { email: 'superadmin@systemgrid.academy' } });
  const existingAudit = await auditLogs.findOne({ where: { module: 'seed', action: 'seed_database', recordId: 'systemgrid-academy' } });
  if (!existingAudit) {
    await auditLogs.save(
      auditLogs.create({
        user: superAdmin ?? undefined,
        action: 'seed_database',
        module: 'seed',
        recordId: 'systemgrid-academy',
        metadata: { courses: additionalCourseSeeds.length + 2, categories: categoryNames.length },
      }),
    );
  }

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  await dataSource.destroy();
  process.exit(1);
});
