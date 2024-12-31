'use client';

import { useEffect, useState } from 'react';

interface SiteVisit {
  url: string;
  title: string;
  totalTime: number;
  onTask: boolean;
  tasks: string[];
}

interface Session {
  id: number;
  sites: SiteVisit[];
  startTime: Date;
  endTime: Date | null;
  paused: boolean;
  customTasks: string[]; // List of custom tasks
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [data, setData] = useState<{
    url: string;
    title: string;
    task: string | null;
    timestamp: string;
    aiResponse: string;
  } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [customTask, setCustomTask] = useState<string>(""); // User-defined task
  const [error, setError] = useState<string | null>(null);
  const API_URL = "http://localhost:3000/data";
  const UPDATE_TASK_URL = "http://localhost:3000/update-task";

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins > 0 ? `${mins}m ` : ""}${secs}s`;
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name);
      setIsAuthenticated(true);
    } else {
      window.location.href = '/signin'; // Redirect to sign-in if not authenticated
    }
  }, []);

  const updateTask = async () => {
    if (currentSessionId !== null) {
      const currentSession = sessions.find((s) => s.id === currentSessionId);
      if (currentSession) {
        if (currentSession.customTasks.length >= 1 && customTask === currentSession.customTasks[currentSession.customTasks.length - 1]) {
          setError("Task is the same as the previous task. Please create a unique task.");
          return;
        }

        if (!currentSession.customTasks.includes(customTask)) {
          currentSession.customTasks.push(customTask);
          setSessions([...sessions]);
        }
      }
    }

    try {
      const res = await fetch(UPDATE_TASK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: customTask }),
      });

      if (!res.ok) {
        throw new Error("Failed to update the task on the server.");
      }

      const result = await res.json();
      setData((prevData) => (prevData ? { ...prevData, task: result.task } : null));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startOrEndSession = () => {
    if (currentSessionId === null) {
      if (!data?.task) {
        setError("Cannot start a session without a current task.");
        return;
      }

      const newSession: Session = {
        id: sessions.length + 1,
        sites: [],
        startTime: new Date(),
        endTime: null,
        paused: false,
        customTasks: [],
      };
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
    } else {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId ? { ...session, endTime: new Date() } : session
        )
      );
      setCurrentSessionId(null);
      setData((prevData) => (prevData ? { ...prevData, task: null } : null)); // Reset the current task
    }
  };

  const pauseOrResumeSession = () => {
    if (currentSessionId !== null) {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId ? { ...session, paused: !session.paused } : session
        )
      );
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch data from the server.");
      }

      const result = await res.json();
      setData(result);

      if (currentSessionId !== null && !sessions.find((s) => s.id === currentSessionId)?.paused) {
        const currentSession = sessions.find((s) => s.id === currentSessionId);
        if (currentSession) {
          const existingSite = currentSession.sites.find((site) => site.url === result.url);
          if (existingSite) {
            existingSite.totalTime += 5;
            if (!existingSite.tasks.includes(result.task)) {
              existingSite.tasks.push(result.task);
            }
          } else {
            currentSession.sites.push({
              url: result.url,
              title: result.title,
              totalTime: 0,
              onTask: result.aiResponse === "Yes",
              tasks: [result.task],
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentSessionId, sessions]);

  if (!isAuthenticated) {
    return null; // Show nothing while redirecting
  }

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Task Tracker Dashboard</h1>
      <p className="text-lg font-medium mb-4">Welcome, {userName}!</p>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => {
          localStorage.removeItem('user');
          window.location.href = '/signin';
        }}
      >
        Sign Out
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="mt-6 p-4 border rounded shadow-sm bg-gray-50">
        <h2 className="text-lg font-semibold">Task Controls</h2>
        <p><strong>Current Task:</strong> {data?.task || "No task set"}</p>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          onClick={startOrEndSession}
        >
          {currentSessionId === null ? "Start Session" : "End Session"}
        </button>
        {currentSessionId !== null && (
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
            onClick={pauseOrResumeSession}
          >
            {sessions.find((s) => s.id === currentSessionId)?.paused ? "Resume Session" : "Pause Session"}
          </button>
        )}
        <input
          type="text"
          className="border p-2 w-full mt-2"
          placeholder="Enter your task"
          value={customTask}
          onChange={(e) => setCustomTask(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          onClick={updateTask}
        >
          Update Task
        </button>
      </div>
      {sessions.map((session) => (
        <div key={session.id} className="mt-6">
          <h2 className="text-lg font-semibold">
            Session {session.id} - {session.startTime.toLocaleDateString()}
          </h2>
          <p>
            <strong>Session Duration:</strong>{" "}
            {session.endTime
              ? formatTime(Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000))
              : "In Progress"}
          </p>
          <p>
            <strong>Percentage On Task:</strong>{" "}
            {session.sites.length > 0
              ? `${Math.round(
                  (session.sites.filter((site) => site.onTask).reduce((acc, site) => acc + site.totalTime, 0) /
                    session.sites.reduce((acc, site) => acc + site.totalTime, 0)) *
                    100
                )}%`
              : "N/A"}
          </p>
          {currentSessionId === session.id || !session.endTime ? (
            <table className="mt-4 border-collapse w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Title</th>
                  <th className="border px-4 py-2">Time Spent</th>
                  <th className="border px-4 py-2">On Task</th>
                  <th className="border px-4 py-2">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {session.sites.map((site, index) => (
                  <tr key={index} className="bg-white">
                    <td className="border px-4 py-2">
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        {site.title}
                      </a>
                    </td>
                    <td className="border px-4 py-2">{formatTime(site.totalTime)}</td>
                    <td className="border px-4 py-2">{site.onTask ? "Yes" : "No"}</td>
                    <td className="border px-4 py-2">{site.tasks.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p><strong>Tasks:</strong> {session.customTasks.join(", ")}</p>
          )}
        </div>
      ))}
    </main>
  );
}
