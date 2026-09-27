"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useEvent } from "@/contexts/EventContext";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/services/taskService";
import type { TaskRow } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/format";

export default function TasksPage() {
  const { event } = useEvent();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);

  async function load() {
    if (!event) return;
    setIsLoading(true);
    setError(null);
    try {
      setTasks(await fetchTasks(event.id));
    } catch (e) {
      setError(`No se pudieron cargar las tareas: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() fetches remote data on mount, not derived state
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function toggleCompleted(task: TaskRow) {
    const updated = await updateTask(task.id, { is_completed: !task.is_completed });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  async function handleDelete() {
    if (!deletingTask) return;
    await deleteTask(deletingTask.id);
    setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
    setDeletingTask(null);
  }

  const pending = tasks.filter((t) => !t.is_completed);
  const completed = tasks.filter((t) => t.is_completed);

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Tareas"
        subtitle="Checklist de planeación"
        action={
          <Button onClick={() => setShowForm(true)}>+ Nueva</Button>
        }
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Sin tareas todavía"
          subtitle="Agrega lo primero que necesites resolver para la fiesta."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pending.length > 0 && (
            <TaskGroup
              title="Pendientes"
              tasks={pending}
              onToggle={toggleCompleted}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
            />
          )}
          {completed.length > 0 && (
            <TaskGroup
              title="Completadas"
              tasks={completed}
              onToggle={toggleCompleted}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
            />
          )}
        </div>
      )}

      {(showForm || editingTask) && (
        <TaskFormModal
          eventId={event.id}
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onSaved={(task) => {
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === task.id);
              return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
            });
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Eliminar "${deletingTask.title}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string;
  tasks: TaskRow[];
  onToggle: (t: TaskRow) => void;
  onEdit: (t: TaskRow) => void;
  onDelete: (t: TaskRow) => void;
}) {
  return (
    <Card>
      <h2 className="mb-2 text-sm font-medium text-muted">{title}</h2>
      <ul className="flex flex-col divide-y divide-hairline">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={() => onToggle(task)}
              className="mt-1 h-4 w-4 accent-sage"
            />
            <button className="flex-1 text-left" onClick={() => onEdit(task)}>
              <p
                className={`text-sm font-medium ${task.is_completed ? "text-muted line-through" : "text-charcoal"}`}
              >
                {task.title}
              </p>
              <p className="text-xs text-muted">
                {[task.assignee, task.category, formatDate(task.due_date)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </button>
            <button
              onClick={() => onDelete(task)}
              className="rounded-full p-1 text-muted hover:bg-declined/15 hover:text-declined"
              aria-label="Eliminar"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TaskFormModal({
  eventId,
  task,
  onClose,
  onSaved,
}: {
  eventId: string;
  task: TaskRow | null;
  onClose: () => void;
  onSaved: (task: TaskRow) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [category, setCategory] = useState(task?.category ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description: description || null,
        due_date: dueDate || null,
        assignee: assignee || null,
        category: category || null,
      };
      const saved = task
        ? await updateTask(task.id, payload)
        : await createTask({ event_id: eventId, ...payload });
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={task ? "Editar tarea" : "Nueva tarea"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="task-title">Título</Label>
          <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="task-description">Descripción</Label>
          <Textarea
            id="task-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-due">Fecha límite</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="task-assignee">Responsable</Label>
            <Input
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="task-category">Categoría</Label>
          <Input
            id="task-category"
            placeholder="Ej. Decoración"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!title} isLoading={isSaving}>
          {task ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </form>
    </Modal>
  );
}
