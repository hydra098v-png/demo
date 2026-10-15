import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  Library,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  UserCircle,
} from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import type { Student, Course, Subject } from '@/types';
import { initials } from '@/lib/utils';
import type { Page } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onViewStudent: (id: string) => void;
}

export function Dashboard({ onNavigate, onViewStudent }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function load() {
      const [studentsRes, coursesRes, subjectsRes] = await Promise.all([
        supabase.from('students').select('*, course:courses(*)').order('name'),
        supabase.from('courses').select('*').order('course_name'),
        supabase.from('subjects').select('*').order('subject_name'),
      ]);
      setStudents(studentsRes.data ?? []);
      setCourses(coursesRes.data ?? []);
      setSubjects(subjectsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const recentStudents = students.slice(0, 5);
  const deptCount = new Set(courses.map((c) => c.department)).size;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 lg:p-8">
        <div className="relative z-10">
          <p className="text-sm font-medium text-blue-100">Welcome back, Admin</p>
          <h2 className="mt-1 text-2xl font-bold text-white lg:text-3xl">
            College Administration Dashboard
          </h2>
          <p className="mt-2 max-w-lg text-sm text-blue-100">
            Manage students, courses, subjects, and academic performance all in one place.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-20 h-32 w-32 rounded-full bg-white/5" />
        <GraduationCap className="absolute bottom-4 right-6 h-28 w-28 text-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={students.length}
          icon={<Users className="h-6 w-6 text-white" />}
          accent="bg-blue-500"
          sublabel="Across all courses"
        />
        <StatCard
          label="Active Courses"
          value={courses.length}
          icon={<BookOpen className="h-6 w-6 text-white" />}
          accent="bg-emerald-500"
          sublabel="Under {deptCount} departments"
        />
        <StatCard
          label="Subjects"
          value={subjects.length}
          icon={<Library className="h-6 w-6 text-white" />}
          accent="bg-amber-500"
          sublabel="Across all semesters"
        />
        <StatCard
          label="Departments"
          value={deptCount}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          accent="bg-purple-500"
          sublabel="Active academic units"
        />
      </div>

      {/* Recent students + course overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" noPadding>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-gray-900">Recent Students</h3>
            <button
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => onViewStudent(student.id)}
                className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-blue-50/40"
              >
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {initials(student.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                  <p className="text-xs text-gray-500">
                    {student.student_id} · {student.course?.course_name ?? '—'}
                  </p>
                </div>
                <Badge variant="blue">Sem {student.semester}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card noPadding>
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-gray-900">Courses Overview</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {courses.slice(0, 5).map((course) => {
              const count = students.filter((s) => s.course_id === course.id).length;
              return (
                <div key={course.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{course.course_name}</p>
                        <p className="text-xs text-gray-500">{course.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-400">students</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          icon={<Users className="h-5 w-5" />}
          label="Manage Students"
          desc="View and edit student profiles"
          onClick={() => onNavigate('students')}
        />
        <QuickAction
          icon={<BookOpen className="h-5 w-5" />}
          label="Manage Courses"
          desc="Add or edit academic courses"
          onClick={() => onNavigate('courses')}
        />
        <QuickAction
          icon={<Library className="h-5 w-5" />}
          label="Manage Subjects"
          desc="Add or edit course subjects"
          onClick={() => onNavigate('subjects')}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowUpRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-600" />
    </button>
  );
}
