/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.error('Starting database seed...');

  // Clean existing data if needed
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.contestParticipant.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.importantLink.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.onboardingProgress.deleteMany();
  await prisma.onboardingStep.deleteMany();
  await prisma.onboardingTrack.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.trainingProgress.deleteMany();
  await prisma.trainingSection.deleteMany();
  await prisma.trainingModulePrerequisite.deleteMany();
  await prisma.trainingModule.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.userNote.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.error('Database cleared. Creating seed data...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  const _admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin',
      fullName: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: userPassword,
      name: 'Sarah',
      fullName: 'Sarah Johnson',
      phoneNumber: '(555) 123-4567',
      position: 'MANAGER',
      role: 'USER',
      emailVerified: new Date(),
      startDate: new Date('2022-01-15'),
      territory: 'Northwest Region',
    },
  });

  const consultant1 = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      password: userPassword,
      name: 'Alex',
      fullName: 'Alex Rodriguez',
      phoneNumber: '(555) 222-3333',
      position: 'ENERGY_CONSULTANT',
      role: 'USER',
      emailVerified: new Date(),
      startDate: new Date('2023-03-10'),
      territory: 'Central District',
    },
  });

  const consultant2 = await prisma.user.create({
    data: {
      email: 'taylor@example.com',
      password: userPassword,
      name: 'Taylor',
      fullName: 'Taylor Wilson',
      phoneNumber: '(555) 444-5555',
      position: 'ENERGY_SPECIALIST',
      role: 'USER',
      emailVerified: new Date(),
      startDate: new Date('2022-07-22'),
      territory: 'Eastern Region',
    },
  });

  const juniorConsultant = await prisma.user.create({
    data: {
      email: 'jordan@example.com',
      password: userPassword,
      name: 'Jordan',
      fullName: 'Jordan Hayes',
      phoneNumber: '(555) 666-7777',
      position: 'JUNIOR_EC',
      role: 'USER',
      emailVerified: new Date(),
      startDate: new Date('2023-11-05'),
      territory: 'Southern District',
    },
  });

  console.error('Created users');

  // Create resources
  const _resources = await Promise.all([
    prisma.resource.create({
      data: {
        title: 'Sales Process Overview',
        description: 'PDF overview of our sales process',
        type: 'PDF',
        url: '/resources/sales-process-guide.pdf',
        isExternal: false,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Product Training Video',
        description: 'Introduction to our energy products',
        type: 'VIDEO',
        url: 'https://example.com/videos/product-intro',
        isExternal: true,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Appointment Setting Scripts',
        description: 'Document with effective appointment setting scripts',
        type: 'DOCUMENT',
        url: '/resources/appointment-scripts.docx',
        isExternal: false,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Company CRM Access',
        description: 'Link to our CRM system',
        type: 'LINK',
        url: 'https://crm.example.com',
        isExternal: true,
      },
    }),
  ]);

  console.error('Created resources');

  // Create training modules and sections
  const onboardingModule = await prisma.trainingModule.create({
    data: {
      title: 'New Hire Onboarding',
      description: 'Essential training for all new employees',
      category: 'ONBOARDING',
      order: 1,
      isRequired: true,
      isPublished: true,
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      estimatedDuration: 120,
      publishedAt: new Date('2023-01-01'),
    },
  });

  const appointmentModule = await prisma.trainingModule.create({
    data: {
      title: 'Appointment Setting Mastery',
      description: 'Learn how to set more appointments and increase your conversion rate',
      category: 'APPOINTMENT_SETTING',
      order: 2,
      isRequired: true,
      isPublished: true,
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'],
      estimatedDuration: 90,
      publishedAt: new Date('2023-01-15'),
    },
  });

  const _productModule = await prisma.trainingModule.create({
    data: {
      title: 'Product Knowledge',
      description: 'Comprehensive information about our energy solutions',
      category: 'PRODUCT_KNOWLEDGE',
      order: 3,
      isRequired: true,
      isPublished: true,
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      estimatedDuration: 180,
      publishedAt: new Date('2023-02-01'),
    },
  });

  // Create sections for the onboarding module
  const sections = await Promise.all([
    prisma.trainingSection.create({
      data: {
        moduleId: onboardingModule.id,
        title: 'Welcome to the Company',
        content:
          "<h1>Welcome to Our Team!</h1><p>We're excited to have you join us. This section will cover our company history, values, and structure.</p>",
        contentFormat: 'HTML',
        order: 1,
      },
    }),
    prisma.trainingSection.create({
      data: {
        moduleId: onboardingModule.id,
        title: 'Getting Started',
        content:
          "# Getting Started\n\nIn this section, you'll learn about our tools, systems, and procedures for your first week.",
        contentFormat: 'MARKDOWN',
        order: 2,
      },
    }),
    prisma.trainingSection.create({
      data: {
        moduleId: appointmentModule.id,
        title: 'Introduction to Appointment Setting',
        content:
          "<h1>The Art of Setting Appointments</h1><p>Learn the fundamentals of effective appointment setting and why it's crucial to your success.</p>",
        contentFormat: 'HTML',
        order: 1,
      },
    }),
    prisma.trainingSection.create({
      data: {
        moduleId: appointmentModule.id,
        title: 'Cold Calling Techniques',
        content:
          '# Cold Calling Techniques\n\nEffective strategies for engaging prospects over the phone and setting appointments.',
        contentFormat: 'MARKDOWN',
        order: 2,
      },
    }),
  ]);

  // Add quiz questions
  const question1 = await prisma.quizQuestion.create({
    data: {
      sectionId: sections[1].id,
      question: 'What is the first thing you should do when starting with a new prospect?',
      questionType: 'MULTIPLE_CHOICE',
      points: 2,
    },
  });

  await prisma.quizOption.createMany({
    data: [
      {
        questionId: question1.id,
        text: 'Immediately ask them to purchase',
        isCorrect: false,
      },
      {
        questionId: question1.id,
        text: 'Build rapport and understand their needs',
        isCorrect: true,
      },
      {
        questionId: question1.id,
        text: 'Talk only about product features',
        isCorrect: false,
      },
      {
        questionId: question1.id,
        text: 'Skip the introduction and go straight to pricing',
        isCorrect: false,
      },
    ],
  });

  const question2 = await prisma.quizQuestion.create({
    data: {
      sectionId: sections[3].id,
      question: 'What is the recommended approach when a prospect objects to the initial call?',
      questionType: 'MULTIPLE_CHOICE',
      points: 3,
    },
  });

  await prisma.quizOption.createMany({
    data: [
      {
        questionId: question2.id,
        text: 'Hang up immediately',
        isCorrect: false,
      },
      {
        questionId: question2.id,
        text: 'Argue with the prospect',
        isCorrect: false,
      },
      {
        questionId: question2.id,
        text: 'Acknowledge the objection and provide value',
        isCorrect: true,
      },
      {
        questionId: question2.id,
        text: 'Transfer the call to your manager',
        isCorrect: false,
      },
    ],
  });

  console.error('Created training modules, sections, and quizzes');

  // Create onboarding tracks and steps
  const juniorTrack = await prisma.onboardingTrack.create({
    data: {
      name: 'Junior Energy Consultant Onboarding',
      description: 'Onboarding process for new Junior Energy Consultants',
      forPositions: ['JUNIOR_EC'],
      isActive: true,
    },
  });

  const _consultantTrack = await prisma.onboardingTrack.create({
    data: {
      name: 'Energy Consultant Onboarding',
      description: 'Onboarding process for Energy Consultants',
      forPositions: ['ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'],
      isActive: true,
    },
  });

  // Create steps for the junior track
  const juniorSteps = await Promise.all([
    prisma.onboardingStep.create({
      data: {
        trackId: juniorTrack.id,
        title: 'Complete New Hire Paperwork',
        description: 'Submit all required employment documents',
        instructions:
          'Please complete and sign all forms in the new hire packet and submit them to HR.',
        order: 1,
        estimatedDuration: 60,
      },
    }),
    prisma.onboardingStep.create({
      data: {
        trackId: juniorTrack.id,
        title: 'System Access Setup',
        description: 'Get access to all required systems',
        instructions: 'Ensure you have login credentials for email, CRM, and training portal.',
        order: 2,
        estimatedDuration: 30,
      },
    }),
    prisma.onboardingStep.create({
      data: {
        trackId: juniorTrack.id,
        title: 'Complete Basic Training',
        description: 'Finish the new hire onboarding module',
        instructions: 'Go to the training section and complete the "New Hire Onboarding" module.',
        order: 3,
        estimatedDuration: 120,
      },
    }),
  ]);

  // Create onboarding progress for the new junior
  await prisma.onboardingProgress.createMany({
    data: [
      {
        userId: juniorConsultant.id,
        stepId: juniorSteps[0].id,
        status: 'COMPLETED',
        startedAt: new Date('2023-11-06'),
        completedAt: new Date('2023-11-06'),
      },
      {
        userId: juniorConsultant.id,
        stepId: juniorSteps[1].id,
        status: 'COMPLETED',
        startedAt: new Date('2023-11-07'),
        completedAt: new Date('2023-11-07'),
      },
      {
        userId: juniorConsultant.id,
        stepId: juniorSteps[2].id,
        status: 'IN_PROGRESS',
        startedAt: new Date('2023-11-08'),
      },
    ],
  });

  console.error('Created onboarding tracks and steps');

  // Create training progress
  await prisma.trainingProgress.createMany({
    data: [
      {
        userId: juniorConsultant.id,
        moduleId: onboardingModule.id,
        status: 'IN_PROGRESS',
        currentSection: 1,
        percentComplete: 50,
      },
      {
        userId: consultant1.id,
        moduleId: onboardingModule.id,
        status: 'COMPLETED',
        percentComplete: 100,
        completedAt: new Date('2023-03-15'),
      },
      {
        userId: consultant1.id,
        moduleId: appointmentModule.id,
        status: 'COMPLETED',
        percentComplete: 100,
        completedAt: new Date('2023-04-01'),
      },
      {
        userId: consultant2.id,
        moduleId: onboardingModule.id,
        status: 'COMPLETED',
        percentComplete: 100,
        completedAt: new Date('2022-08-01'),
      },
    ],
  });

  console.error('Created training progress records');

  // Create calendar events
  const teamMeeting = await prisma.calendarEvent.create({
    data: {
      title: 'Weekly Team Meeting',
      description: 'Regular team sync to discuss progress and challenges',
      eventType: 'MEETING',
      startDate: new Date('2023-12-01T10:00:00'),
      endDate: new Date('2023-12-01T11:00:00'),
      location: 'Main Conference Room',
      locationUrl: 'https://meet.example.com/team-meeting',
      recurrence: 'WEEKLY',
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      createdById: manager.id,
    },
  });

  const _blitzEvent = await prisma.calendarEvent.create({
    data: {
      title: 'Holiday Sales Blitz',
      description: 'Special 10-day sales blitz for the holiday season',
      eventType: 'BLITZ',
      isBlitz: true,
      startDate: new Date('2023-12-05'),
      endDate: new Date('2023-12-15'),
      allDay: true,
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      createdById: manager.id,
    },
  });

  const trainingEvent = await prisma.calendarEvent.create({
    data: {
      title: 'Product Training Workshop',
      description: 'In-depth training on new energy products',
      eventType: 'TRAINING',
      startDate: new Date('2023-12-08T13:00:00'),
      endDate: new Date('2023-12-08T16:00:00'),
      location: 'Training Room A',
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'],
      createdById: manager.id,
    },
  });

  // Add attendees to events
  await prisma.eventAttendee.createMany({
    data: [
      {
        eventId: teamMeeting.id,
        userId: manager.id,
        status: 'ACCEPTED',
      },
      {
        eventId: teamMeeting.id,
        userId: consultant1.id,
        status: 'ACCEPTED',
      },
      {
        eventId: teamMeeting.id,
        userId: consultant2.id,
        status: 'ACCEPTED',
      },
      {
        eventId: teamMeeting.id,
        userId: juniorConsultant.id,
        status: 'PENDING',
      },
      {
        eventId: trainingEvent.id,
        userId: juniorConsultant.id,
        status: 'ACCEPTED',
      },
      {
        eventId: trainingEvent.id,
        userId: consultant1.id,
        status: 'ACCEPTED',
      },
      {
        eventId: trainingEvent.id,
        userId: consultant2.id,
        status: 'DECLINED',
      },
    ],
  });

  console.error('Created calendar events');

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'New Product Launch',
        content:
          "<h2>Exciting New Product Launch!</h2><p>We're thrilled to announce the launch of our new energy efficiency package. Training will be provided next week.</p>",
        priority: 'HIGH',
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
        publishDate: new Date('2023-11-15'),
        expiryDate: new Date('2023-12-15'),
        isPinned: true,
      },
      {
        title: 'Office Closure Notice',
        content:
          'Please note that the office will be closed on December 25th and 26th for the holidays.',
        priority: 'MEDIUM',
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
        publishDate: new Date('2023-11-20'),
        expiryDate: new Date('2023-12-27'),
      },
      {
        title: 'CRM Update This Weekend',
        content:
          'Our CRM system will be updated this weekend. Expect 2-3 hours of downtime on Saturday night.',
        priority: 'LOW',
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
        publishDate: new Date('2023-11-22'),
        expiryDate: new Date('2023-11-26'),
      },
    ],
  });

  // Create important links
  await prisma.importantLink.createMany({
    data: [
      {
        title: 'Company Intranet',
        url: 'https://intranet.example.com',
        description: 'Access company resources and information',
        category: 'Company Resources',
        icon: 'building',
        order: 1,
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      },
      {
        title: 'Benefits Portal',
        url: 'https://benefits.example.com',
        description: 'Manage your health benefits and retirement',
        category: 'HR Resources',
        icon: 'heart',
        order: 2,
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      },
      {
        title: 'Sales Materials',
        url: 'https://drive.example.com/sales-materials',
        description: 'Access up-to-date sales collateral',
        category: 'Sales Resources',
        icon: 'document',
        order: 3,
        visibleToRoles: ['USER', 'ADMIN'],
        visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'],
      },
    ],
  });

  console.error('Created announcements and important links');

  // Create contests
  const salesContest = await prisma.contest.create({
    data: {
      title: 'Q4 Sales Challenge',
      description:
        'Who can close the most sales in Q4? The top performers will win amazing prizes!',
      contestType: 'SALES',
      status: 'ACTIVE',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-12-31'),
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'],
      prizes: JSON.stringify({
        firstPlace: 'Weekend trip for two',
        secondPlace: '$500 gift card',
        thirdPlace: '$250 gift card',
      }),
      rules:
        '1. All sales must be final with no cancellations\n2. Only new customer sales count\n3. Winners announced by January 15th',
    },
  });

  const appointmentContest = await prisma.contest.create({
    data: {
      title: 'December Appointment Setting Sprint',
      description: 'Set the most appointments in December to win!',
      contestType: 'APPOINTMENTS',
      status: 'UPCOMING',
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-31'),
      visibleToRoles: ['USER', 'ADMIN'],
      visibleToPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT'],
      prizes: JSON.stringify({
        firstPlace: '$300 gift card',
        secondPlace: '$150 gift card',
        thirdPlace: '$75 gift card',
      }),
    },
  });

  // Add contest participants
  await prisma.contestParticipant.createMany({
    data: [
      {
        contestId: salesContest.id,
        userId: consultant1.id,
        score: 76.5,
        rank: 1,
      },
      {
        contestId: salesContest.id,
        userId: consultant2.id,
        score: 65.0,
        rank: 2,
      },
      {
        contestId: appointmentContest.id,
        userId: consultant1.id,
        score: 0, // Contest hasn't started yet
      },
      {
        contestId: appointmentContest.id,
        userId: consultant2.id,
        score: 0, // Contest hasn't started yet
      },
      {
        contestId: appointmentContest.id,
        userId: juniorConsultant.id,
        score: 0, // Contest hasn't started yet
      },
    ],
  });

  console.error('Created contests');

  // Create leaderboards
  const closersLeaderboard = await prisma.leaderboard.create({
    data: {
      name: 'Top Closers',
      description: 'Recognizing our top sales performers',
      type: 'CLOSERS',
      period: 'MONTHLY',
      forPositions: ['ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'],
      isActive: true,
    },
  });

  const appointmentSettersLeaderboard = await prisma.leaderboard.create({
    data: {
      name: 'Appointment Champions',
      description: 'Our best appointment setters',
      type: 'APPOINTMENT_SETTERS',
      period: 'MONTHLY',
      forPositions: ['JUNIOR_EC', 'ENERGY_CONSULTANT'],
      isActive: true,
    },
  });

  // Add leaderboard entries
  await prisma.leaderboardEntry.createMany({
    data: [
      {
        leaderboardId: closersLeaderboard.id,
        userId: consultant1.id,
        score: 85.5,
        rank: 1,
        periodStart: new Date('2023-11-01'),
        periodEnd: new Date('2023-11-30'),
        metrics: JSON.stringify({
          totalSales: 23,
          revenue: 187600,
          avgDealSize: 8156.52,
        }),
      },
      {
        leaderboardId: closersLeaderboard.id,
        userId: consultant2.id,
        score: 72.0,
        rank: 2,
        periodStart: new Date('2023-11-01'),
        periodEnd: new Date('2023-11-30'),
        metrics: JSON.stringify({
          totalSales: 18,
          revenue: 156000,
          avgDealSize: 8666.67,
        }),
      },
      {
        leaderboardId: appointmentSettersLeaderboard.id,
        userId: juniorConsultant.id,
        score: 68.0,
        rank: 1,
        periodStart: new Date('2023-11-01'),
        periodEnd: new Date('2023-11-30'),
        metrics: JSON.stringify({
          totalAppointments: 34,
          conversionRate: 0.42,
          qualityScore: 8.2,
        }),
      },
      {
        leaderboardId: appointmentSettersLeaderboard.id,
        userId: consultant1.id,
        score: 58.5,
        rank: 2,
        periodStart: new Date('2023-11-01'),
        periodEnd: new Date('2023-11-30'),
        metrics: JSON.stringify({
          totalAppointments: 28,
          conversionRate: 0.39,
          qualityScore: 8.5,
        }),
      },
    ],
  });

  console.error('Created leaderboards');

  // Create achievements
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: 'Fast Starter',
        description: 'Completed onboarding in record time',
        badgeImageUrl: '/badges/fast-starter.png',
        points: 50,
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Appointment Master',
        description: 'Set 50+ appointments in a month',
        badgeImageUrl: '/badges/appointment-master.png',
        points: 100,
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Sales Champion',
        description: 'Exceeded monthly sales target by 25%',
        badgeImageUrl: '/badges/sales-champion.png',
        points: 150,
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Perfect Attendance',
        description: 'Attended all training sessions in a quarter',
        badgeImageUrl: '/badges/perfect-attendance.png',
        points: 75,
      },
    }),
  ]);

  // Award achievements to users
  await prisma.userAchievement.createMany({
    data: [
      {
        userId: consultant1.id,
        achievementId: achievements[2].id, // Sales Champion
        awardedAt: new Date('2023-10-15'),
      },
      {
        userId: consultant1.id,
        achievementId: achievements[3].id, // Perfect Attendance
        awardedAt: new Date('2023-09-30'),
      },
      {
        userId: consultant2.id,
        achievementId: achievements[0].id, // Fast Starter
        awardedAt: new Date('2022-08-15'),
      },
      {
        userId: juniorConsultant.id,
        achievementId: achievements[1].id, // Appointment Master
        awardedAt: new Date('2023-11-28'),
      },
    ],
  });

  console.error('Created achievements');

  console.error('Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
