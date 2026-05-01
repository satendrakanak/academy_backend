import { DataSource } from 'typeorm';
import { Course } from 'src/courses/course.entity';

const createId = (value: string) => value;

const demoFaqs = (courseTitle: string) => [
  {
    question: `Is ${courseTitle} beginner friendly?`,
    answer:
      'Yes. The course starts with foundations and then gradually moves into practical application.',
  },
  {
    question: 'Will I get a certificate after completion?',
    answer:
      'Yes, but only after you complete the learning content and pass the final exam.',
  },
  {
    question: 'How should I prepare for the final exam?',
    answer:
      'Revise the lesson notes, review key concepts, and finish all lectures before attempting the exam.',
  },
];

const createDemoExam = (courseTitle: string) => ({
  title: `${courseTitle} Final Assessment`,
  description:
    'A mixed-format exam to validate practical understanding before certification is issued.',
  instructions:
    'Answer every question carefully. MCQs, written answers, and drag-and-drop order questions are included. Passing this assessment is mandatory for certificate eligibility.',
  passingPercentage: 70,
  maxAttempts: 3,
  timeLimitMinutes: 20,
  showResultImmediately: true,
  isPublished: true,
  questions: [
    {
      id: createId('q1'),
      prompt: 'Which statement best describes the primary goal of this course?',
      type: 'single' as const,
      points: 2,
      explanation: 'The course focuses on practical understanding and confident application.',
      acceptedAnswers: [],
      options: [
        { id: createId('q1o1'), text: 'Only theory with no real-world use', isCorrect: false },
        { id: createId('q1o2'), text: 'Practical understanding with structured application', isCorrect: true },
        { id: createId('q1o3'), text: 'Fast memorisation without fundamentals', isCorrect: false },
      ],
    },
    {
      id: createId('q2'),
      prompt: 'Select the study habits that help a learner perform better in this program.',
      type: 'multiple' as const,
      points: 3,
      explanation: 'Consistency, revision, and applying concepts improve retention and exam performance.',
      acceptedAnswers: [],
      options: [
        { id: createId('q2o1'), text: 'Regular revision', isCorrect: true },
        { id: createId('q2o2'), text: 'Skipping key modules', isCorrect: false },
        { id: createId('q2o3'), text: 'Applying concepts to case examples', isCorrect: true },
        { id: createId('q2o4'), text: 'Attempting the exam without watching lectures', isCorrect: false },
      ],
    },
    {
      id: createId('q3'),
      prompt: 'Write one word: what should a learner build through this course besides knowledge?',
      type: 'short_text' as const,
      points: 2,
      explanation: 'Confidence is a core learner outcome highlighted across the academy experience.',
      acceptedAnswers: ['confidence', 'self confidence', 'self-confidence'],
      options: [],
    },
    {
      id: createId('q4'),
      prompt: 'Arrange the journey in the most sensible order for certification.',
      type: 'drag_drop' as const,
      points: 3,
      explanation: 'A learner should study first, revise next, attempt the exam, and then claim the certificate.',
      acceptedAnswers: [],
      options: [
        { id: createId('q4o1'), text: 'Complete lessons', isCorrect: false },
        { id: createId('q4o2'), text: 'Revise key concepts', isCorrect: false },
        { id: createId('q4o3'), text: 'Attempt the final exam', isCorrect: false },
        { id: createId('q4o4'), text: 'Unlock certificate', isCorrect: false },
      ],
    },
    {
      id: createId('q5'),
      prompt: 'True or False: Passing the final exam can be skipped if all lectures are complete.',
      type: 'true_false' as const,
      points: 2,
      explanation: 'For courses with a published exam, both lecture completion and exam pass are required.',
      acceptedAnswers: [],
      options: [
        { id: createId('q5o1'), text: 'True', isCorrect: false },
        { id: createId('q5o2'), text: 'False', isCorrect: true },
      ],
    },
  ],
});

export async function seedCourseLearningDemo(dataSource: DataSource) {
  const courseRepository = dataSource.getRepository(Course);
  const courses = await courseRepository.find({
    order: { id: 'ASC' },
    take: 2,
  });

  if (!courses.length) {
    console.log('⚠️ No courses found for demo exam seeding');
    return;
  }

  for (const course of courses) {
    course.faqs = demoFaqs(course.title);
    course.exam = createDemoExam(course.title);
    course.exams = 'Final assessment required for certification';
    await courseRepository.save(course);
  }

  console.log(`✅ Demo FAQs and exams seeded for ${courses.length} course(s)`);
}
