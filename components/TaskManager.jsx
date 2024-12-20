"use client";
import React, { useState } from 'react';
import styles from '@/styles/TaskManager.module.css';
import Card from '@/components/Card';
import { CheckIcon } from '@/components/Icons'; // Assuming you have an icon component for check
import Button from '@/components/Button'; // Assuming you have a button component

const TaskManager = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Finish proposal', date: 'Today', assignedTo: 'Unassigned' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [assignedUser, setAssignedUser] = useState('Unassigned');

  const handleAddTask = () => {
    if (newTask.trim() !== '') {
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          text: newTask,
          date: 'No due date', // Default value for simplicity
          assignedTo: assignedUser,
        },
      ]);
      setNewTask('');
      setAssignedUser('Unassigned');
    }
  };

  const handleTaskCompletion = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  return (
    <div className={styles.container}>
      <Card className={styles.taskCard}>
        <Card.Header className={styles.cardHeader}>
          <Card.Title className={styles.cardTitle}>Tasks</Card.Title>
          <Card.Description className={styles.cardDescription}>
            Manage your tasks and stay on top of your to-do list.
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
              value={assignedUser}
              onChange={(e) => setAssignedUser(e.target.value)}
            >
              <option value="Unassigned">Unassigned</option>
              <option value="Alice">Alice</option>
              <option value="Bob">Bob</option>
              {/* Add more options as needed */}
            </select>
            <Button onClick={handleAddTask} className={styles.addTaskButton}>
              Add Task
            </Button>
          </div>

          <div className={styles.taskList}>
            {tasks.map((task) => (
              <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
                <div className={styles.taskInfo}>
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={() => handleTaskCompletion(task.id)}
                    className={styles.taskCheckbox}
                  />
                  <div className={styles.taskText}>{task.text}</div>
                </div>
                <div className={styles.taskDetails}>
                  <span className={styles.taskDate}>{task.date}</span>
                  <span className={styles.taskAssignedTo}>
                    Assigned to: {task.assignedTo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
        <Card.Footer className={styles.cardFooter}>
          <Button className={styles.viewAllTasksButton}>View All Tasks</Button>
        </Card.Footer>
      </Card>
      {/* Repeat for other cards if needed */}
    </div>
  );
};

export default TaskManager;
