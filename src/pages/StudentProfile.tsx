import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Users as UsersIcon,
  BookOpen,
  GraduationCap,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  FileText,
  ClipboardList,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import {
  formatDate,
  calculatePercentage,
  gradeFromPercentage,
  attendancePercentage,
  initials,
} from '@/lib/utils';
import type { Student, Course, Subject, Attendance, Mark, Assignment } from '@/types';

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
}

type Tab = 'overview' | 'attendance' | 'marks' | 'subjects' | 'assignments';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
  { id: 'attendance', label: 'Attendance', icon: <CheckCircle className="h-4 w-4" /> },
  { id: 'marks', label: 'Marks', icon: <Award className="h-4 w-4" /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4 w-4" /> },
];

export function StudentProfile({ studentId, onBack }: StudentProfileProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: studentData } = await supabase
        .from('students')
        .select('*, course:courses(*)')
        .eq('id', studentId)
        .maybeSingle();
      if (!studentData) {
        setLoading(false);
        return;
      }
      setStudent(studentData as Student);
      setEditForm({
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone ?? '',
        date_of_birth: studentData.date_of_birth ?? '',
        gender: studentData.gender ?? 'Male',
        address: studentData.address ?? '',
        course_id: studentData.course_id ?? '',
        semester: String(studentData.semester),
        section: studentData.section ?? '',
        photo_url: studentData.photo_url ?? '',
      });

      const [coursesRes, subjectsRes, attendanceRes, marksRes, assignmentsRes] = await Promise.all([
        supabase.from('courses').select('*').order('course_name'),
        supabase.from('subjects').select('*, course:courses(*)').eq('course_id', studentData.course_id).order('semester'),
        supabase.from('attendance').select('*, subject:subjects(*)').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('marks').select('*, subject:subjects(*)').eq('student_id', studentId),
        supabase.from('assignments').select('*, subject:subjects(*)').eq('student_id', studentId).order('created_at', { ascending: false }),
      ]);

      setCourses(coursesRes.data ?? []);
      setSubjects(subjectsRes.data ?? []);
      setAttendance(attendanceRes.data ?? []);
      setMarks(marksRes.data ?? []);
      setAssignments(assignmentsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [studentId]);

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        date_of_birth: editForm.date_of_birth || null,
        gender: editForm.gender,
        address: editForm.address,
        course_id: editForm.course_id,
        semester: Number(editForm.semester),
        section: editForm.section,
        photo_url: editForm.photo_url || null,
      })
      .eq('id', student.id);
    setSaving(false);
    if (error) {
      toast('Failed to update student profile', 'error');
      return;
    }
    const { data } = await supabase
      .from('students')
      .select('*, course:courses(*)')
      .eq('id', student.id)
      .maybeSingle();
    if (data) setStudent(data as Student);
    toast('Profile updated successfully');
    setShowEdit(false);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!student) {
    return (
      <Card>
        <EmptyState title="Student not found" description="This student may have been removed." action={<Button onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>Back to Students</Button>} />
      </Card>
    );
  }

  const att = attendancePercentage(attendance);
  const totalMarks = marks.reduce(
    (acc, m) => ({
      internal: acc.internal + m.internal_marks,
      assignment: acc.assignment + m.assignment_marks,
      exam: acc.exam + m.exam_marks,
    }),
    { internal: 0, assignment: 0, exam: 0 }
  );
  const overallPct = marks.length > 0
    ? Math.round(marks.reduce((acc, m) => acc + calculatePercentage(m.internal_marks, m.assignment_marks, m.exam_marks), 0) / marks.length)
    : 0;
  const grade = gradeFromPercentage(overallPct);
  const studentSubjects = subjects.filter((s) => s.semester === student.semester);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Profile header card */}
      <Card className="overflow-hidden" noPadding>
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-700" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="-mt-12 h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700 ring-4 ring-white shadow-lg">
                  {initials(student.name)}
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-sm text-gray-500">{student.course?.course_name ?? '—'} · Semester {student.semester} · Section {student.section}</p>
              </div>
            </div>
            <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Student info */}
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-base font-bold text-gray-900">Student Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={<User className="h-4 w-4" />} label="Student ID" value={student.student_id} />
              <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Enrollment Number" value={student.enrollment_number} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || '—'} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={formatDate(student.date_of_birth)} />
              <InfoRow icon={<UsersIcon className="h-4 w-4" />} label="Gender" value={student.gender || '—'} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={student.address || '—'} />
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Course" value={student.course?.course_name ?? '—'} />
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Semester" value={`Semester ${student.semester}`} />
              <InfoRow icon={<UsersIcon className="h-4 w-4" />} label="Section" value={student.section || '—'} />
            </div>
          </Card>

          {/* Academic summary */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Overall Percentage</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{overallPct}%</p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 ${grade.color}`}>
                  <span className="text-2xl font-bold">{grade.grade}</span>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Attendance</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{att.percentage}%</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-emerald-600 font-semibold">{att.present} Present</span>
                <span className="text-red-500 font-semibold">{att.absent} Absent</span>
                <span className="text-gray-400 font-semibold">{att.total} Total</span>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-500">Marks Breakdown</p>
                <MarkBar label="Internal" value={totalMarks.internal} max={20 * marks.length} color="bg-blue-500" />
                <MarkBar label="Assignment" value={totalMarks.assignment} max={20 * marks.length} color="bg-amber-500" />
                <MarkBar label="Examination" value={totalMarks.exam} max={80 * marks.length} color="bg-emerald-500" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card noPadding>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Attendance Records</h3>
              <Badge variant={att.percentage >= 75 ? 'green' : 'red'}>
                {att.percentage}% · {att.present}/{att.total} classes
              </Badge>
            </div>
          </div>
          {attendance.length === 0 ? (
            <EmptyState title="No attendance records" description="Attendance hasn't been recorded for this student yet." icon={<CheckCircle className="h-8 w-8" />} />
          ) : (
            <Table
              columns={[
                { key: 'date', label: 'Date', render: (a: Attendance) => formatDate(a.date) },
                { key: 'subject', label: 'Subject', render: (a: Attendance) => (
                  <div>
                    <p className="font-medium text-gray-900">{a.subject?.subject_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{a.subject?.subject_code}</p>
                  </div>
                )},
                { key: 'status', label: 'Status', render: (a: Attendance) => (
                  a.status === 'present'
                    ? <Badge variant="green" icon={<CheckCircle className="h-3 w-3" />}>Present</Badge>
                    : <Badge variant="red" icon={<XCircle className="h-3 w-3" />}>Absent</Badge>
                )},
              ]}
              data={attendance}
              rowKey={(a) => a.id}
            />
          )}
        </Card>
      )}

      {activeTab === 'marks' && (
        <Card noPadding>
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-gray-900">Academic Marks</h3>
          </div>
          {marks.length === 0 ? (
            <EmptyState title="No marks recorded" description="Internal, assignment, and exam marks haven't been entered yet." icon={<Award className="h-8 w-8" />} />
          ) : (
            <Table
              columns={[
                { key: 'subject', label: 'Subject', render: (m: Mark) => (
                  <div>
                    <p className="font-medium text-gray-900">{m.subject?.subject_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{m.subject?.subject_code}</p>
                  </div>
                )},
                { key: 'internal_marks', label: 'Internal (/20)', render: (m: Mark) => <span className="font-semibold">{m.internal_marks}</span> },
                { key: 'assignment_marks', label: 'Assignment (/20)', render: (m: Mark) => <span className="font-semibold">{m.assignment_marks}</span> },
                { key: 'exam_marks', label: 'Exam (/80)', render: (m: Mark) => <span className="font-semibold">{m.exam_marks}</span> },
                { key: 'total', label: 'Total', render: (m: Mark) => {
                  const pct = calculatePercentage(m.internal_marks, m.assignment_marks, m.exam_marks);
                  const g = gradeFromPercentage(pct);
                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{pct}%</span>
                      <Badge variant="blue">{g.grade}</Badge>
                    </div>
                  );
                }},
              ]}
              data={marks}
              rowKey={(m) => m.id}
            />
          )}
        </Card>
      )}

      {activeTab === 'subjects' && (
        <Card noPadding>
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-gray-900">Enrolled Subjects — Semester {student.semester}</h3>
          </div>
          {studentSubjects.length === 0 ? (
            <EmptyState title="No subjects found" description="No subjects are assigned to this semester for the student's course." icon={<BookOpen className="h-8 w-8" />} />
          ) : (
            <Table
              columns={[
                { key: 'subject_code', label: 'Code', render: (s: Subject) => <span className="font-mono text-xs font-semibold">{s.subject_code}</span> },
                { key: 'subject_name', label: 'Subject Name', render: (s: Subject) => <span className="font-medium text-gray-900">{s.subject_name}</span> },
                { key: 'credits', label: 'Credits', render: (s: Subject) => <Badge variant="blue">{s.credits} cr</Badge> },
                { key: 'faculty', label: 'Faculty', render: (s: Subject) => <span className="text-sm">{s.faculty}</span> },
                { key: 'semester', label: 'Semester', render: (s: Subject) => <span className="text-sm">Sem {s.semester}</span> },
              ]}
              data={studentSubjects}
              rowKey={(s) => s.id}
            />
          )}
        </Card>
      )}

      {activeTab === 'assignments' && (
        <Card noPadding>
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-gray-900">Assignments</h3>
          </div>
          {assignments.length === 0 ? (
            <EmptyState title="No assignments" description="No assignments have been recorded for this student yet." icon={<ClipboardList className="h-8 w-8" />} />
          ) : (
            <Table
              columns={[
                { key: 'title', label: 'Title', render: (a: Assignment) => <span className="font-medium text-gray-900">{a.title}</span> },
                { key: 'subject', label: 'Subject', render: (a: Assignment) => (
                  <div>
                    <p className="text-sm">{a.subject?.subject_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{a.subject?.subject_code}</p>
                  </div>
                )},
                { key: 'submitted', label: 'Status', render: (a: Assignment) => (
                  a.submitted
                    ? <Badge variant="green" icon={<CheckCircle className="h-3 w-3" />}>Submitted</Badge>
                    : <Badge variant="amber" icon={<FileText className="h-3 w-3" />}>Pending</Badge>
                )},
                { key: 'marks', label: 'Marks', render: (a: Assignment) => (
                  <span className="font-semibold">{a.marks}/{a.max_marks}</span>
                )},
                { key: 'percentage', label: 'Score', render: (a: Assignment) => {
                  const pct = a.max_marks > 0 ? Math.round((a.marks / a.max_marks) * 100) : 0;
                  return <Badge variant={pct >= 50 ? 'green' : 'red'}>{pct}%</Badge>;
                }},
              ]}
              data={assignments}
              rowKey={(a) => a.id}
            />
          )}
        </Card>
      )}

      {/* Edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student Profile" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Email" type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input label="Phone" value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Date of Birth" type="date" value={editForm.date_of_birth ?? ''} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
          <Select label="Gender" value={editForm.gender ?? 'Male'} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Select>
          <Select label="Course" value={editForm.course_id ?? ''} onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}>
            <option value="">Select a course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
          </Select>
          <Select label="Semester" value={editForm.semester ?? '1'} onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </Select>
          <Select label="Section" value={editForm.section ?? 'A'} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}>
            {['A','B','C','D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </Select>
          <Input label="Photo URL" value={editForm.photo_url ?? ''} onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })} placeholder="https://..." />
          <Input label="Address" value={editForm.address ?? ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function MarkBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-bold text-gray-900">{value}/{max || '—'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
