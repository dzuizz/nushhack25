export interface User {
  conversationsCompleted: string[];
  hasCompletedProfile: boolean;
  currentTargetId?: string;
  hobbies: string[];
  createdAt: number;
  score: number;
  email: string;
  major: string;
  name: string;
  uid: string;
}

export interface Target {
  targetUserId: string;
  completedAt?: number;
  isCompleted: boolean;
  assignedAt: number;
  userId: string;
}

export interface Conversation {
  reportReason?: string;
  reportedBy?: string;
  startedAt: number;
  isActive: boolean;
  duration?: number;
  endedAt?: number;
  user1Id: string;
  user2Id: string;
  id: string;
}

export interface Report {
  status: 'pending' | 'reviewed' | 'resolved';
  conversationId: string;
  reportedUserId: string;
  reporterId: string;
  timestamp: number;
  reason: string;
  id: string;
}

export interface LeaderboardEntry {
  userId: string;
  major: string;
  score: number;
  name: string;
  rank: number;
}
