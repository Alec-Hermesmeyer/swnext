"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/styles/TaskManager.module.css';
import Card from '@/components/Card';
import Button from '@/components/Button';
import supabase from '@/components/Supabase';
import { useAuth } from '@/context/AuthContext';

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);

  // Fetch profiles to populate "Assign to" dropdown
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) console.error('Error fetching profiles:', error);
      setProfiles(data || []);
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch tasks where current user is creator or assigned user
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`)
      .order('inserted_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAddTask = async () => {
    const trimmedTask = newTask.trim();
    if (!trimmedTask) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        text: trimmedTask,
        due_date: dueDate || null,
        assigned_user_id: assignedUserId || null,
        user_id: user.id
      });

    if (error) {
      console.error('Error adding task:', error);
    } else {
      setNewTask('');
      setAssignedUserId('');
      setDueDate('');
      fetchTasks();
    }
  };

  const handleTaskCompletion = async (taskId, currentStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !currentStatus })
      .eq('id', taskId);
    if (error) console.error('Error updating task completion:', error);
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
    fetchTasks();
  };

  if (!user) {
    return <div>Please log in to manage your tasks.</div>;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.taskCard}>
        <Card.Header className={styles.cardHeader}>
          <Card.Title className={styles.cardTitle}>Tasks</Card.Title>
          <Card.Description className={styles.cardDescription}>
            Manage your tasks and assign them to team members.
          </Card.Description>
        </Card.Header>
        <Card.Content className={styles.cardContent}>
          <div className={styles.taskInputSection}>
            <input
              type="text"
              className={styles.taskInput}
              placeholder="Add a new task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <select
              className={styles.assignDropdown}
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Button onClick={handleAddTask} className={styles.addTaskButton}>
              Add Task
            </Button>
          </div>

          {loading ? (
            <div>Loading tasks...</div>
          ) : (
            <div className={styles.taskList}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
                >
                  <div className={styles.taskInfo}>
                    <input
                      type="checkbox"
                      checked={task.completed || false}
                      onChange={() => handleTaskCompletion(task.id, task.completed)}
                      className={styles.taskCheckbox}
                    />
                    <div className={styles.taskText}>{task.text}</div>
                  </div>
                  <div className={styles.taskDetails}>
                    <span className={styles.taskDate}>
                      {task.due_date ? task.due_date : 'No due date'}
                    </span>
                    <span className={styles.taskAssignedTo}>
                      Assigned to: 
                      {task.assigned_user_id
                        ? profiles.find(p => p.id === task.assigned_user_id)?.full_name || 'Unknown'
                        : 'Unassigned'}
                    </span>
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      className={styles.deleteTaskButton}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default TaskManager;
