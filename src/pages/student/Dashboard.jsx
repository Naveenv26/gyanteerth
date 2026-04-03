import { useAuth } from '../../shared/AuthContext';
import { useEnrollment } from '../../shared/EnrollmentContext';
import { BookOpen, Award, Clock, FastForward } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
  <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
    <div style={{ backgroundColor: color, color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text)' }}>{value}</h3>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{title}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const enrollmentCtx = useEnrollment();

  // If EnrollmentContext is not available, default to empty arrays
  const enrolledCourses = enrollmentCtx?.enrolledCourses || [];
  const completedLessons = enrollmentCtx?.completedLessons || {};
  const lessonCounts = enrollmentCtx?.lessonCounts || {};

  const totalCompleted = enrolledCourses.filter(c => c.progress === 100).length;
  const inProgress = enrolledCourses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Welcome back, {user?.name || 'Student'}! 👋</h1>
        <p>Here's an overview of your real learning progress.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Enrolled Courses" value={enrolledCourses.length} icon={<BookOpen size={24} />} color="var(--color-primary)" />
        <StatCard title="Completed" value={totalCompleted} icon={<Award size={24} />} color="#3b82f6" />
        <StatCard title="In Progress" value={inProgress} icon={<FastForward size={24} />} color="#f59e0b" />
        <StatCard title="Learning Hours" value="0h" icon={<Clock size={24} />} color="#8b5cf6" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="premium-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Continue Learning
            <Link to="/student/courses" style={{ fontSize: '0.875rem', fontWeight: 600 }}>View All</Link>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrolledCourses.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>You haven't enrolled in any courses yet.</p>}
            {enrolledCourses.slice(0, 3).map(course => (
              <div key={course.course_id || course.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{course.title || course.course_title}</h4>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>{course.progress || 0}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-border)', height: '0.5rem', borderRadius: '1rem', overflow: 'hidden' }}>
                  <div style={{ width: `${course.progress || 0}%`, backgroundColor: 'var(--color-primary)', height: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Upcoming Live Classes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No live sessions scheduled.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
