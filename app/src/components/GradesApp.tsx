import { useState } from 'react';
import { Header } from './Header';
import { TeacherSetGrades } from './TeacherSetGrades';
import { MyGrades } from './MyGrades';
import { ShareGrade } from './ShareGrade';
import { ViewSharedGrade } from './ViewSharedGrade';

export function GradesApp() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'my' | 'share' | 'view'>('my');

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('teacher')} style={tabStyle(activeTab === 'teacher')}>Teacher: Set Grade</button>
          <button onClick={() => setActiveTab('my')} style={tabStyle(activeTab === 'my')}>My Grades</button>
          <button onClick={() => setActiveTab('share')} style={tabStyle(activeTab === 'share')}>Share My Grade</button>
          <button onClick={() => setActiveTab('view')} style={tabStyle(activeTab === 'view')}>View Shared Grade</button>
        </div>

        {activeTab === 'teacher' && <TeacherSetGrades />}
        {activeTab === 'my' && <MyGrades />}
        {activeTab === 'share' && <ShareGrade />}
        {activeTab === 'view' && <ViewSharedGrade />}
      </main>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #CBD5E1',
    background: active ? '#2563EB' : '#F8FAFC',
    color: active ? '#FFF' : '#0F172A',
    cursor: 'pointer',
  };
}

