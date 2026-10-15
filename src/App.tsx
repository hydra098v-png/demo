import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { StudentsList } from '@/pages/StudentsList';
import { StudentProfile } from '@/pages/StudentProfile';
import { CoursesPage } from '@/pages/CoursesPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import type { Page } from '@/types';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleNavigate = (p: Page) => {
    setPage(p);
    setSearch('');
  };

  const handleViewStudent = (id: string) => {
    setSelectedStudentId(id);
    setPage('student-profile');
  };

  const showSearch = page === 'students' || page === 'courses' || page === 'subjects';
  const searchPlaceholder =
    page === 'students'
      ? 'Search by name, ID, email...'
      : page === 'courses'
      ? 'Search courses...'
      : page === 'subjects'
      ? 'Search subjects, faculty...'
      : 'Search...';

  return (
    <ToastProvider>
      <Layout
        current={page}
        onNavigate={handleNavigate}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        showSearch={showSearch}
      >
        {page === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} onViewStudent={handleViewStudent} />
        )}
        {page === 'students' && (
          <StudentsList search={search} onViewStudent={handleViewStudent} />
        )}
        {page === 'student-profile' && selectedStudentId && (
          <StudentProfile
            studentId={selectedStudentId}
            onBack={() => handleNavigate('students')}
          />
        )}
        {page === 'courses' && <CoursesPage search={search} />}
        {page === 'subjects' && <SubjectsPage search={search} />}
      </Layout>
    </ToastProvider>
  );
}

export default App;
