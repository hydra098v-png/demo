export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  duration: string;
  num_semesters: number;
  created_at?: string;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty: string;
  created_at?: string;
  course?: Course;
}

export interface Student {
  id: string;
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  course_id: string;
  semester: number;
  section: string;
  photo_url: string;
  created_at?: string;
  course?: Course;
}

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  subject?: Subject;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  internal_marks: number;
  assignment_marks: number;
  exam_marks: number;
  subject?: Subject;
}

export interface Assignment {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  submitted: boolean;
  marks: number;
  max_marks: number;
  subject?: Subject;
}

export type Page = 'dashboard' | 'students' | 'student-profile' | 'courses' | 'subjects';
