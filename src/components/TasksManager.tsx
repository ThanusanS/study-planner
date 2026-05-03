import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import databaseService, { Task, Subject } from '../services/databaseService';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select';
import { Badge } from '../app/components/ui/badge';
import { Checkbox } from '../app/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

export const TasksManager: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [tasksData, subjectsData] = await Promise.all([
        databaseService.getTasks(user!.$id),
        databaseService.getSubjects(user!.$id),
      ]);
      setTasks(tasksData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const subjectId = formData.get('subjectId') as string;
    const dueDate = formData.get('dueDate') as string;
    const reminderTime = formData.get('reminderTime') as string;

    try {
      const newTask = await databaseService.createTask({
        userId: user!.$id,
        title,
        subjectId,
        dueDate,
        reminderTime: reminderTime || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setTasks([newTask, ...tasks]);
      setIsDialogOpen(false);
      toast.success('Task created successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      const updated = await databaseService.updateTask(task.$id!, { status: newStatus });
      setTasks(tasks.map(t => t.$id === task.$id ? updated : t));
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await databaseService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.$id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const subjectMatch = filterSubject === 'all' || task.subjectId === filterSubject;
    return statusMatch && subjectMatch;
  });

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const date = task.dueDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your daily study tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new study task to your planner</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Complete Chapter 5 exercises"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject</Label>
                <Select name="subjectId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.$id} value={subject.$id!}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Reminder Time (Optional)</Label>
                <Input
                  id="reminderTime"
                  name="reminderTime"
                  type="time"
                />
              </div>
              <Button type="submit" className="w-full">Create Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.$id} value={subject.$id!}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {Object.keys(groupedTasks).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tasks found. Create your first task to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, dateTasks]) => {
              const dateObj = new Date(date);
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const isPast = dateObj < new Date() && !isToday;

              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(dateObj, 'EEEE, MMMM d, yyyy')}
                      {isToday && <Badge>Today</Badge>}
                      {isPast && <Badge variant="destructive">Overdue</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {dateTasks.filter(t => t.status === 'completed').length} of {dateTasks.length} completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dateTasks.map(task => {
                      const subject = subjects.find(s => s.$id === task.subjectId);
                      return (
                        <div
                          key={task.$id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Checkbox
                              checked={task.status === 'completed'}
                              onCheckedChange={() => handleToggleTask(task)}
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {subject && (
                                  <Badge
                                    variant="outline"
                                    style={{ borderColor: subject.color, color: subject.color }}
                                  >
                                    {subject.name}
                                  </Badge>
                                )}
                                {task.reminderTime && (
                                  <span className="text-xs text-muted-foreground">
                                    Reminder: {task.reminderTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.$id!)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};
