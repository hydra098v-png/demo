import { useEffect, useState } from 'react';
import { Eye, UserPlus, Search, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { initials } from '@/lib/utils';
import type { Student, Course } from '@/types';

interface StudentsListProps {
  search: string;
  onViewStudent: (id: string) => void;
}

export function StudentsList({ search, onViewStudent }: StudentsListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    enrollment_number: '',
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    course_id: '',
    semester: '1',
    section: 'A',
    photo_url: '',
  });

  useEffect(() => {
    async function load() {
      const [studentsRes, coursesRes] = await Promise.all([
        supabase.from('students').select('*, course:courses(*)').order('name'),
        supabase.from('courses').select('*').order('course_name'),
      ]);
      setStudents(studentsRes.data ?? []);
      setCourses(coursesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.enrollment_number.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.course?.course_name ?? '').toLowerCase().includes(q)
    );
  });

  const handleAdd = async () => {
    if (!form.student_id || !form.enrollment_number || !form.name || !form.email || !form.course_id) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('students').insert({
      student_id: form.student_id,
      enrollment_number: form.enrollment_number,
      name: form.name,
      email: form.email,
      phone: form.phone,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      address: form.address,
      course_id: form.course_id,
      semester: Number(form.semester),
      section: form.section,
      photo_url: form.photo_url || null,
    });
    setSaving(false);
    if (error) {
      toast(error.message.includes('duplicate') ? 'Student ID or Enrollment Number already exists' : 'Failed to add student', 'error');
      return;
    }
    toast('Student added successfully');
    setShowAdd(false);
    setForm({
      student_id: '', enrollment_number: '', name: '', email: '', phone: '',
      date_of_birth: '', gender: 'Male', address: '', course_id: '', semester: '1',
      section: 'A', photo_url: '',
    });
    const { data } = await supabase.from('students').select('*, course:courses(*)').order('name');
    setStudents(data ?? []);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Students</h2>
          <p className="mt-0.5 text-sm text-gray-500">{filtered.length} of {students.length} students</p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
          Add Student
        </Button>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No students found"
            description={search ? "Try adjusting your search terms." : "Add your first student to get started."}
            icon={<Users className="h-8 w-8" />}
            action={!search && <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Add Student</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                label: 'Student',
                render: (s: Student) => (
                  <div className="flex items-center gap-3">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {initials(s.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'student_id', label: 'Student ID', render: (s: Student) => <span className="font-mono text-xs">{s.student_id}</span> },
              { key: 'enrollment_number', label: 'Enrollment No.', render: (s: Student) => <span className="font-mono text-xs">{s.enrollment_number}</span> },
              {
                key: 'course',
                label: 'Course',
                render: (s: Student) => <span className="text-sm">{s.course?.course_name ?? '—'}</span>,
              },
              { key: 'semester', label: 'Sem', render: (s: Student) => <Badge variant="blue">Sem {s.semester}</Badge> },
              { key: 'section', label: 'Section', render: (s: Student) => <Badge variant="gray">{s.section}</Badge> },
              {
                key: 'actions',
                label: '',
                render: (s: Student) => (
                  <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => onViewStudent(s.id)}>
                    View
                  </Button>
                ),
              },
            ]}
            data={filtered}
            rowKey={(s) => s.id}
            onRowClick={(s) => onViewStudent(s.id)}
          />
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Student ID *" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="STU009" />
          <Input label="Enrollment Number *" value={form.enrollment_number} onChange={(e) => setForm({ ...form, enrollment_number: e.target.value })} placeholder="ENR20240009" />
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@college.edu" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
          <Select label="Course *" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
            <option value="">Select a course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
          </Select>
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </Select>
          <Select label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
            {['A','B','C','D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
          </Select>
          <Input label="Photo URL" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, State" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add Student'}</Button>
        </div>
      </Modal>
    </div>
  );
}
