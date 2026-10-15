import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Library, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import type { Subject, Course } from '@/types';

interface SubjectsPageProps {
  search: string;
}

export function SubjectsPage({ search }: SubjectsPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject_code: '',
    subject_name: '',
    course_id: '',
    semester: '1',
    credits: '3',
    faculty: '',
  });

  async function loadSubjects() {
    setLoading(true);
    const { data } = await supabase
      .from('subjects')
      .select('*, course:courses(*)')
      .order('subject_name');
    setSubjects(data ?? []);
    const { data: coursesData } = await supabase.from('courses').select('*').order('course_name');
    setCourses(coursesData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.subject_name.toLowerCase().includes(q) ||
      s.subject_code.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q) ||
      (s.course?.course_name ?? '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ subject_code: '', subject_name: '', course_id: '', semester: '1', credits: '3', faculty: '' });
    setShowForm(true);
  };

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setForm({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      course_id: subject.course_id,
      semester: String(subject.semester),
      credits: String(subject.credits),
      faculty: subject.faculty,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.subject_code || !form.subject_name || !form.course_id || !form.faculty) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('subjects')
        .update({
          subject_code: form.subject_code,
          subject_name: form.subject_name,
          course_id: form.course_id,
          semester: Number(form.semester),
          credits: Number(form.credits),
          faculty: form.faculty,
        })
        .eq('id', editing.id);
      setSaving(false);
      if (error) {
        toast('Failed to update subject', 'error');
        return;
      }
      toast('Subject updated successfully');
    } else {
      const { error } = await supabase.from('subjects').insert({
        subject_code: form.subject_code,
        subject_name: form.subject_name,
        course_id: form.course_id,
        semester: Number(form.semester),
        credits: Number(form.credits),
        faculty: form.faculty,
      });
      setSaving(false);
      if (error) {
        toast(error.message.includes('duplicate') ? 'Subject code already exists' : 'Failed to add subject', 'error');
        return;
      }
      toast('Subject added successfully');
    }
    setShowForm(false);
    loadSubjects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('subjects').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast('Failed to delete subject', 'error');
      return;
    }
    toast('Subject deleted successfully');
    setDeleteTarget(null);
    loadSubjects();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Subject Management</h2>
          <p className="mt-0.5 text-sm text-gray-500">{filtered.length} of {subjects.length} subjects</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Subject</Button>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No subjects found"
            description={search ? "Try adjusting your search." : "Add your first subject to get started."}
            icon={<Library className="h-8 w-8" />}
            action={!search && <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Subject</Button>}
          />
        ) : (
          <Table
            columns={[
              { key: 'subject_code', label: 'Subject Code', render: (s: Subject) => <span className="font-mono text-xs font-semibold">{s.subject_code}</span> },
              { key: 'subject_name', label: 'Subject Name', render: (s: Subject) => <span className="font-semibold text-gray-900">{s.subject_name}</span> },
              { key: 'course', label: 'Course', render: (s: Subject) => <span className="text-sm">{s.course?.course_name ?? '—'}</span> },
              { key: 'semester', label: 'Semester', render: (s: Subject) => <Badge variant="blue">Sem {s.semester}</Badge> },
              { key: 'credits', label: 'Credits', render: (s: Subject) => <Badge variant="amber">{s.credits} cr</Badge> },
              { key: 'faculty', label: 'Faculty', render: (s: Subject) => (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {s.faculty.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="text-sm">{s.faculty}</span>
                </div>
              )},
              {
                key: 'actions',
                label: '',
                render: (s: Subject) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            rowKey={(s) => s.id}
          />
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Subject' : 'Add New Subject'}>
        <div className="space-y-4">
          <Input label="Subject Code *" value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. CS101" />
          <Input label="Subject Name *" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="e.g. Programming in C" />
          <Select label="Course *" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
            <option value="">Select a course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
            <Input label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </div>
          <Input label="Faculty *" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} placeholder="e.g. Dr. Rajesh Kumar" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Subject'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.subject_name}"? This will also remove related attendance, marks, and assignments. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
