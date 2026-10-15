import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import type { Course, Subject } from '@/types';

interface CoursesPageProps {
  search: string;
}

export function CoursesPage({ search }: CoursesPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<(Course & { subject_count?: number; student_count?: number })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    course_code: '',
    course_name: '',
    department: '',
    duration: '3 Years',
    num_semesters: '6',
  });

  async function loadCourses() {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('course_name');
    const coursesData = data ?? [];

    const [subjectsRes, studentsRes] = await Promise.all([
      supabase.from('subjects').select('course_id'),
      supabase.from('students').select('course_id'),
    ]);

    const subjectCounts: Record<string, number> = {};
    (subjectsRes.data ?? []).forEach((s: { course_id: string }) => {
      subjectCounts[s.course_id] = (subjectCounts[s.course_id] ?? 0) + 1;
    });
    const studentCounts: Record<string, number> = {};
    (studentsRes.data ?? []).forEach((s: { course_id: string }) => {
      studentCounts[s.course_id] = (studentCounts[s.course_id] ?? 0) + 1;
    });

    setCourses(
      coursesData.map((c) => ({
        ...c,
        subject_count: subjectCounts[c.id] ?? 0,
        student_count: studentCounts[c.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course_name.toLowerCase().includes(q) ||
      c.course_code.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ course_code: '', course_name: '', department: '', duration: '3 Years', num_semesters: '6' });
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      department: course.department,
      duration: course.duration,
      num_semesters: String(course.num_semesters),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.course_code || !form.course_name || !form.department) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('courses')
        .update({
          course_code: form.course_code,
          course_name: form.course_name,
          department: form.department,
          duration: form.duration,
          num_semesters: Number(form.num_semesters),
        })
        .eq('id', editing.id);
      setSaving(false);
      if (error) {
        toast('Failed to update course', 'error');
        return;
      }
      toast('Course updated successfully');
    } else {
      const { error } = await supabase.from('courses').insert({
        course_code: form.course_code,
        course_name: form.course_name,
        department: form.department,
        duration: form.duration,
        num_semesters: Number(form.num_semesters),
      });
      setSaving(false);
      if (error) {
        toast(error.message.includes('duplicate') ? 'Course code already exists' : 'Failed to add course', 'error');
        return;
      }
      toast('Course added successfully');
    }
    setShowForm(false);
    loadCourses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('courses').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast('Failed to delete course', 'error');
      return;
    }
    toast('Course deleted successfully');
    setDeleteTarget(null);
    loadCourses();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Course Management</h2>
          <p className="mt-0.5 text-sm text-gray-500">{filtered.length} of {courses.length} courses</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Course</Button>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No courses found"
            description={search ? "Try adjusting your search." : "Add your first course to get started."}
            icon={<BookOpen className="h-8 w-8" />}
            action={!search && <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Course</Button>}
          />
        ) : (
          <Table
            columns={[
              { key: 'course_code', label: 'Course ID', render: (c: Course) => <span className="font-mono text-xs font-semibold">{c.course_code}</span> },
              { key: 'course_name', label: 'Course Name', render: (c: Course) => <span className="font-semibold text-gray-900">{c.course_name}</span> },
              { key: 'department', label: 'Department', render: (c: Course) => <Badge variant="blue">{c.department}</Badge> },
              { key: 'duration', label: 'Duration', render: (c: Course) => <span className="text-sm">{c.duration}</span> },
              { key: 'num_semesters', label: 'Semesters', render: (c: Course) => <span className="text-sm font-semibold">{c.num_semesters}</span> },
              {
                key: 'counts',
                label: 'Subjects',
                render: (c: Course & { subject_count?: number }) => <Badge variant="gray">{c.subject_count ?? 0} subjects</Badge>,
              },
              {
                key: 'students',
                label: 'Students',
                render: (c: Course & { student_count?: number }) => <Badge variant="green">{c.student_count ?? 0} students</Badge>,
              },
              {
                key: 'actions',
                label: '',
                render: (c: Course) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            rowKey={(c) => c.id}
          />
        )}
      </Card>

      {/* Add/Edit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Course' : 'Add New Course'}>
        <div className="space-y-4">
          <Input label="Course Code *" value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} placeholder="e.g. BCA" />
          <Input label="Course Name *" value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} placeholder="e.g. Bachelor of Computer Applications" />
          <Input label="Department *" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 Years" />
            <Input label="Number of Semesters" type="number" value={form.num_semesters} onChange={(e) => setForm({ ...form, num_semesters: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Course'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.course_name}"? This will also delete all subjects and related data linked to this course. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
