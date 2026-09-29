import { useState } from 'react';
import { VIEWS, DEFAULT_VIEW, NO_FILTERS } from './constants';

import useProjectStore from '../hooks/useProjectStore';
import useHashRoute from '../hooks/useHashRoute';
import useTaskDialogs from '../hooks/useTaskDialogs';
import useImportNotice from '../hooks/useImportNotice';
import { exportProject } from '../services/storageService';

import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import Dashboard from '../components/dashboard/Dashboard';
import KanbanBoard from '../components/board/KanbanBoard';
import DependencyMap from '../components/dependencies/DependencyMap';
import DependencyInsights from '../components/dependencies/DependencyInsights';
import ActivityLog from '../components/activity/ActivityLog';
import TaskForm from '../components/tasks/TaskForm';
import TaskDetail from '../components/tasks/TaskDetail';
import ConfirmDialog from '../components/common/ConfirmDialog';

const VIEW_IDS = VIEWS.map((view) => view.id);

/**
 * App shell.
 *
 * Owns no business logic: it connects the project store, the router and the
 * popup state to the presentational components below.
 */
export default function App() {
  /* ----- Data + navigation ----- */
  const { state, actions } = useProjectStore();
  const { tasks, activity } = state;

  const [viewId, navigate] = useHashRoute(VIEW_IDS, DEFAULT_VIEW);
  const currentView = VIEWS.find((view) => view.id === viewId);

  // Board filters live here so they survive switching pages
  const [filters, setFilters] = useState(NO_FILTERS);

  /* ----- Popups + import ----- */
  const dialogs = useTaskDialogs(tasks, actions);
  const { notice, clearNotice, importFile } = useImportNotice(tasks, actions);

  return (
    <div className="shell">
      {/* ===== Left navigation ===== */}
      <Sidebar
        view={viewId}
        onNavigate={navigate}
        onNewTask={dialogs.startNewTask}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={actions.undo}
        onRedo={actions.redo}
        onExport={() => exportProject(tasks)}
        onImportFile={importFile}
      />

      {/* ===== Main content ===== */}
      <div className="content">
        {/* Announces the latest change to screen readers */}
        <p className="sr" aria-live="polite">
          {notice || activity[0]?.text}
        </p>

        {notice && (
          <p className="notice" role="status">
            {notice}{' '}
            <button className="link" onClick={clearNotice}>
              dismiss
            </button>
          </p>
        )}

        {/* key={viewId} remounts the section so the entrance animation replays */}
        <main key={viewId} className="view">
          {/* The Activity log carries its own header inside its card */}
          {viewId !== 'log' && (
            <PageHeader title={currentView.label} subtitle={currentView.subtitle}>
              {viewId === 'board' && (
                <button className="primary" onClick={dialogs.startNewTask}>
                  ＋ New Task
                </button>
              )}
            </PageHeader>
          )}

          {viewId === 'dashboard' && (
            <div className="vbody">
              <Dashboard tasks={tasks} />
            </div>
          )}

          {viewId === 'board' && (
            <KanbanBoard
              tasks={tasks}
              filters={filters}
              setFilters={setFilters}
              onOpen={dialogs.openDetail}
              onMove={actions.move}
            />
          )}

          {viewId === 'map' && (
            <div className="vbody">
              <DependencyMap tasks={tasks} onOpen={dialogs.openDetail} />
              <DependencyInsights tasks={tasks} onOpen={dialogs.openDetail} />
            </div>
          )}

          {viewId === 'log' && <ActivityLog activity={activity} />}
        </main>
      </div>

      {/* ===== Popups ===== */}
      {dialogs.detailTask && (
        <TaskDetail
          task={dialogs.detailTask}
          tasks={tasks}
          onClose={dialogs.closeDetail}
          onOpen={dialogs.openDetail}
          onMove={actions.move}
          onEdit={dialogs.startEditingDetailTask}
          onDelete={dialogs.askToDeleteDetailTask}
        />
      )}

      {dialogs.editing && (
        <TaskForm
          task={dialogs.editing === 'new' ? null : dialogs.editing}
          tasks={tasks}
          onClose={dialogs.closeForm}
          onSave={dialogs.saveAndClose}
        />
      )}

      {dialogs.deleting && (
        <ConfirmDialog
          title="Delete task?"
          message={`“${dialogs.deleting.title}” will be removed and unlinked from every task that depends on it.`}
          onConfirm={dialogs.confirmDelete}
          onCancel={dialogs.cancelDelete}
        />
      )}
    </div>
  );
}
