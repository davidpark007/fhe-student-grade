import { useState } from 'react';
import { Header } from './Header';
import { TeacherSetGrades } from './TeacherSetGrades';
import { MyGrades } from './MyGrades';
import { ShareGrade } from './ShareGrade';
import { ViewSharedGrade } from './ViewSharedGrade';
import '../styles/GradesApp.css';

export function GradesApp() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'my' | 'share' | 'view'>('my');

  return (
    <div>
      <Header />
      <main className="grades-app">
        <div className="grades-container">
          <div className="tab-navigation">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
            >
              <span className="tab-icon">👨‍🏫</span>
              Teacher
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
            >
              <span className="tab-icon">📊</span>
              My Grades
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
            >
              <span className="tab-icon">🔗</span>
              Share
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
            >
              <span className="tab-icon">👁️</span>
              View Shared
            </button>
          </div>

          <div className="content-card">
            {activeTab === 'teacher' && <TeacherSetGrades />}
            {activeTab === 'my' && <MyGrades />}
            {activeTab === 'share' && <ShareGrade />}
            {activeTab === 'view' && <ViewSharedGrade />}
          </div>
        </div>
      </main>
    </div>
  );
}

