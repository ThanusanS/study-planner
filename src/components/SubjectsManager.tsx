import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import databaseService, { Subject, Topic } from '../services/databaseService';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../app/components/ui/dialog';
import { Badge } from '../app/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, List } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../app/components/ui/accordion';

const SUBJECT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export const SubjectsManager: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [loading, setLoading] = useState(true);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [activeSubjectForTopic, setActiveSubjectForTopic] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const subjectsData = await databaseService.getSubjects(user!.$id);
      setSubjects(subjectsData);

      const topicsData: Record<string, Topic[]> = {};
      for (const subject of subjectsData) {
        const subjectTopics = await databaseService.getTopicsBySubject(subject.$id!);
        topicsData[subject.$id!] = subjectTopics;
      }
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    try {
      const newSubject = await databaseService.createSubject({
        userId: user!.$id,
        name,
        color,
        createdAt: new Date().toISOString(),
      });
      setSubjects([newSubject, ...subjects]);
      setTopics({ ...topics, [newSubject.$id!]: [] });
      setIsSubjectDialogOpen(false);
      toast.success('Subject created successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure? This will delete all associated topics and tasks.')) return;

    try {
      await databaseService.deleteSubject(subjectId);
      setSubjects(subjects.filter(s => s.$id !== subjectId));
      const newTopics = { ...topics };
      delete newTopics[subjectId];
      setTopics(newTopics);
      toast.success('Subject deleted');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent<HTMLFormElement>, subjectId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('topicName') as string;

    try {
      const newTopic = await databaseService.createTopic({
        subjectId,
        name,
      });
      setTopics({
        ...topics,
        [subjectId]: [...(topics[subjectId] || []), newTopic],
      });
      setActiveSubjectForTopic(null);
      toast.success('Topic added');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to add topic');
    }
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    try {
      await databaseService.deleteTopic(topicId);
      setTopics({
        ...topics,
        [subjectId]: topics[subjectId].filter(t => t.$id !== topicId),
      });
      toast.success('Topic deleted');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subjects & Topics</h1>
          <p className="text-muted-foreground">Organize your study materials</p>
        </div>
        <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>Add a new subject to your study planner</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-7 gap-2">
                  {SUBJECT_COLORS.map(color => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        required
                        className="sr-only peer"
                      />
                      <div
                        className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-primary peer-checked:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Create Subject</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No subjects yet. Create your first subject to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map(subject => (
            <Card key={subject.$id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: subject.color }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      <BookOpen className="h-6 w-6" style={{ color: subject.color }} />
                    </div>
                    <div>
                      <CardTitle>{subject.name}</CardTitle>
                      <CardDescription>
                        {topics[subject.$id!]?.length || 0} topics
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubject(subject.$id!)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="topics" className="border-none">
                    <AccordionTrigger className="py-2">
                      <span className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        View Topics
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {topics[subject.$id!]?.map(topic => (
                          <div
                            key={topic.$id}
                            className="flex items-center justify-between p-2 rounded border hover:bg-accent group"
                          >
                            <span className="text-sm">{topic.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTopic(subject.$id!, topic.$id!)}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {activeSubjectForTopic === subject.$id ? (
                          <form
                            onSubmit={(e) => handleCreateTopic(e, subject.$id!)}
                            className="flex gap-2"
                          >
                            <Input
                              name="topicName"
                              placeholder="Topic name"
                              required
                              autoFocus
                              className="h-8"
                            />
                            <Button type="submit" size="sm" className="h-8">Add</Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveSubjectForTopic(null)}
                              className="h-8"
                            >
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveSubjectForTopic(subject.$id!)}
                            className="w-full"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Topic
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
