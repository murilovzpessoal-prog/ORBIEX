export interface UserAccount {
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince: string;
  tier: string;
}

export interface LessonAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'sheet' | 'template' | 'zip' | 'link';
  url?: string;
  token?: string;
  description?: string;
  downloadContent?: string;
}

export interface LessonComment {
  id: string;
  author: string;
  avatar?: string;
  role?: string;
  timeAgo: string;
  text: string;
  likes: number;
  isInstructor?: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleName: string;
  number: string;
  title: string;
  duration: string;
  videoUrl?: string;
  coverImage: string;
  description: string;
  fullContent: string;
  takeaways: string[];
  checklist: string[];
  attachments: LessonAttachment[];
  comments: LessonComment[];
}

export interface CourseModule {
  id: string;
  number: string;
  title: string;
  description: string;
  coverImage: string;
  badge: string;
  accentColor: string;
  lessons: Lesson[];
}

export interface CourseData {
  title: string;
  subtitle: string;
  instructor: {
    name: string;
    title: string;
    avatar: string;
  };
  totalHours: string;
  announcements: {
    id: string;
    title: string;
    date: string;
    content: string;
    badge?: string;
  }[];
  modules: CourseModule[];
}
