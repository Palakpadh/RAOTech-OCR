// ── Types ──

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
};

export type Thread = {
  id: string;
  type: "client";
  clientName: string;
  clientAvatar?: string;
  invoiceNumber?: string;
  invoiceId?: string;
  gstin?: string;
  status: "open" | "waiting" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  assignedTo?: string;
  tags: string[];
};

export type GroupMember = {
  user: User;
  role: "admin" | "member" | "viewer";
  joinedAt: string;
};

export type Group = {
  id: string;
  type: "group";
  name: string;
  description?: string;
  groupType: "open" | "invite-only";
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
  isPinned: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageSender: string;
  lastMessageTime: string;
};

export type Attachment = {
  id: string;
  name: string;
  type: "pdf" | "image" | "spreadsheet" | "other";
  size: string;
  url: string;
};

export type Message = {
  id: string;
  threadId: string;
  sender: "client" | "team" | "system";
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  channel: "whatsapp" | "email" | "internal";
  deliveryStatus?: "sent" | "delivered" | "read";
  isInternalNote?: boolean;
  replyTo?: string;
  mentions?: string[];
  attachments?: Attachment[];
  isPinned?: boolean;
};

export type Invite = {
  id: string;
  groupId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "expired";
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
};

// ── Mock Users ──

export const mockUsers: User[] = [
  { id: "u1", name: "Nitin Patidar", email: "nitin@raotech.in", isOnline: true },
  { id: "u2", name: "Rahul Sharma", email: "rahul@raotech.in", isOnline: true },
  { id: "u3", name: "Priya Desai", email: "priya@raotech.in", isOnline: true },
  { id: "u4", name: "Amit Patel", email: "amit@raotech.in", isOnline: false },
  { id: "u5", name: "Sneha Joshi", email: "sneha@raotech.in", isOnline: false },
  { id: "u6", name: "Vivek Kumar", email: "vivek@raotech.in", isOnline: true },
];

// ── Mock Threads (Client Conversations) ──

export const mockThreads: Thread[] = [
  {
    id: "t1",
    type: "client",
    clientName: "Arun Textiles Pvt Ltd",
    invoiceNumber: "INV-2024-0892",
    invoiceId: "inv_001",
    gstin: "27AABCU9603R1ZM",
    status: "open",
    priority: "high",
    unreadCount: 3,
    lastMessage: "Hi, the GSTIN on invoice #892 seems incorrect. Can you recheck?",
    lastMessageTime: "2h ago",
    assignedTo: "u2",
    tags: ["gstin-issue", "urgent"],
  },
  {
    id: "t2",
    type: "client",
    clientName: "Priya Exports",
    invoiceNumber: "INV-2024-0901",
    invoiceId: "inv_002",
    gstin: "29AADCB2230M1Z3",
    status: "waiting",
    priority: "medium",
    unreadCount: 0,
    lastMessage: "We need the bank statement for August. Can you upload it by EOD?",
    lastMessageTime: "Yesterday",
    assignedTo: "u3",
    tags: ["bank-statement"],
  },
  {
    id: "t3",
    type: "client",
    clientName: "Mehta & Sons Trading",
    invoiceNumber: "INV-2024-0878",
    invoiceId: "inv_003",
    gstin: "24AAFCM7806Q1ZK",
    status: "open",
    priority: "low",
    unreadCount: 1,
    lastMessage: "Please share the updated ledger copy for Q2 reconciliation.",
    lastMessageTime: "3d ago",
    assignedTo: "u1",
    tags: ["ledger"],
  },
  {
    id: "t4",
    type: "client",
    clientName: "Gupta Pharma Dist.",
    invoiceNumber: "INV-2024-0915",
    invoiceId: "inv_004",
    gstin: "07AADCG5678P1ZR",
    status: "resolved",
    priority: "low",
    unreadCount: 0,
    lastMessage: "Thanks, the corrected invoice has been received. All good now.",
    lastMessageTime: "5d ago",
    tags: ["resolved"],
  },
  {
    id: "t5",
    type: "client",
    clientName: "Rathi Steels Ltd",
    invoiceNumber: "INV-2024-0923",
    invoiceId: "inv_005",
    gstin: "33AABCR4567M1ZQ",
    status: "open",
    priority: "urgent",
    unreadCount: 5,
    lastMessage: "GSTR-3B filing deadline is tomorrow! Missing 3 invoices from your side.",
    lastMessageTime: "30m ago",
    assignedTo: "u2",
    tags: ["gst-filing", "deadline"],
  },
];

// ── Mock Groups (Team Chats) ──

export const mockGroups: Group[] = [
  {
    id: "g1",
    type: "group",
    name: "GST Filing Team",
    description: "Coordination for monthly GST returns and reconciliation",
    groupType: "invite-only",
    createdBy: "u1",
    createdAt: "2024-08-10",
    members: [
      { user: mockUsers[0], role: "admin", joinedAt: "2024-08-10" },
      { user: mockUsers[1], role: "member", joinedAt: "2024-08-10" },
      { user: mockUsers[2], role: "member", joinedAt: "2024-08-11" },
      { user: mockUsers[3], role: "member", joinedAt: "2024-08-12" },
      { user: mockUsers[5], role: "viewer", joinedAt: "2024-08-15" },
    ],
    isPinned: true,
    unreadCount: 4,
    lastMessage: "Check GSTR-3B mismatch for Rathi Steels. ITC gap is ₹42K.",
    lastMessageSender: "Rahul Sharma",
    lastMessageTime: "30m ago",
  },
  {
    id: "g2",
    type: "group",
    name: "Monthly Closing",
    description: "End-of-month closing coordination & bank reconciliation",
    groupType: "open",
    createdBy: "u1",
    createdAt: "2024-07-01",
    members: [
      { user: mockUsers[0], role: "admin", joinedAt: "2024-07-01" },
      { user: mockUsers[1], role: "admin", joinedAt: "2024-07-01" },
      { user: mockUsers[2], role: "member", joinedAt: "2024-07-01" },
      { user: mockUsers[3], role: "member", joinedAt: "2024-07-02" },
      { user: mockUsers[4], role: "member", joinedAt: "2024-07-03" },
      { user: mockUsers[5], role: "member", joinedAt: "2024-07-05" },
    ],
    isPinned: false,
    unreadCount: 0,
    lastMessage: "All bank statements for August have been uploaded. Ready to close.",
    lastMessageSender: "Priya Desai",
    lastMessageTime: "1h ago",
  },
  {
    id: "g3",
    type: "group",
    name: "Audit Prep 2024",
    description: "FY 2023-24 audit preparation — documents, checklists, queries",
    groupType: "invite-only",
    createdBy: "u2",
    createdAt: "2024-06-15",
    members: [
      { user: mockUsers[1], role: "admin", joinedAt: "2024-06-15" },
      { user: mockUsers[0], role: "member", joinedAt: "2024-06-15" },
      { user: mockUsers[4], role: "member", joinedAt: "2024-06-16" },
    ],
    isPinned: false,
    unreadCount: 2,
    lastMessage: "Vouchers for Q3 are ready. Need to verify party ledgers.",
    lastMessageSender: "Nitin Patidar",
    lastMessageTime: "Yesterday",
  },
];

// ── Mock Messages (for thread t1: Arun Textiles) ──

export const mockMessagesThread1: Message[] = [
  {
    id: "m1",
    threadId: "t1",
    sender: "system",
    senderName: "System",
    content: "Thread created — linked to Invoice INV-2024-0892",
    timestamp: "Aug 18, 10:00 AM",
    channel: "internal",
    deliveryStatus: "read",
  },
  {
    id: "m2",
    threadId: "t1",
    sender: "team",
    senderName: "Rahul Sharma",
    content: "Hi Arun Textiles, we noticed a discrepancy in the GSTIN on invoice #892. Could you please verify the GSTIN and resend the corrected document?",
    timestamp: "Aug 18, 10:05 AM",
    channel: "whatsapp",
    deliveryStatus: "delivered",
  },
  {
    id: "m3",
    threadId: "t1",
    sender: "client",
    senderName: "Arun Textiles",
    content: "Hi, let me check with our accounts team. Will get back to you shortly.",
    timestamp: "Aug 18, 11:30 AM",
    channel: "whatsapp",
    deliveryStatus: "read",
  },
  {
    id: "m4",
    threadId: "t1",
    sender: "team",
    senderName: "Rahul Sharma",
    content: "@Nitin — FYI, waiting on Arun Textiles for GSTIN correction. May impact this month's GSTR-1 filing.",
    timestamp: "Aug 18, 2:00 PM",
    channel: "internal",
    isInternalNote: true,
    mentions: ["u1"],
  },
  {
    id: "m5",
    threadId: "t1",
    sender: "system",
    senderName: "System",
    content: "Automated reminder sent via WhatsApp — \"GSTIN correction pending for INV-2024-0892\"",
    timestamp: "Aug 19, 9:00 AM",
    channel: "whatsapp",
    deliveryStatus: "delivered",
  },
  {
    id: "m6",
    threadId: "t1",
    sender: "client",
    senderName: "Arun Textiles",
    content: "Sorry for the delay. The correct GSTIN is 27AABCU9603R1ZM. We are sending the updated invoice now.",
    timestamp: "Aug 20, 10:15 AM",
    channel: "whatsapp",
  },
  {
    id: "m7",
    threadId: "t1",
    sender: "client",
    senderName: "Arun Textiles",
    content: "Hi, the GSTIN on invoice #892 seems incorrect. Can you recheck?",
    timestamp: "Aug 20, 3:00 PM",
    channel: "email",
  },
];

// ── Mock Messages (for group g1: GST Filing Team) ──

export const mockMessagesGroup1: Message[] = [
  {
    id: "gm1",
    threadId: "g1",
    sender: "team",
    senderName: "Rahul Sharma",
    senderAvatar: undefined,
    content: "GSTR-1 for July is almost done. Just need 2 more invoices from Arun Textiles.",
    timestamp: "Aug 20, 9:30 AM",
    channel: "internal",
  },
  {
    id: "gm2",
    threadId: "g1",
    sender: "team",
    senderName: "Priya Desai",
    content: "I've uploaded the ITC comparison sheet. Check the shared files section.",
    timestamp: "Aug 20, 10:00 AM",
    channel: "internal",
    attachments: [
      { id: "a1", name: "ITC_Comparison_Aug.xlsx", type: "spreadsheet", size: "245 KB", url: "#" },
    ],
  },
  {
    id: "gm3",
    threadId: "g1",
    sender: "team",
    senderName: "Nitin Patidar",
    content: "@Rahul any update on Rathi Steels? They have 3 invoices pending and deadline is tomorrow.",
    timestamp: "Aug 20, 11:45 AM",
    channel: "internal",
    mentions: ["u2"],
  },
  {
    id: "gm4",
    threadId: "g1",
    sender: "team",
    senderName: "Amit Patel",
    content: "Just verified — Gupta Pharma's GSTR-2B matches. No discrepancies.",
    timestamp: "Aug 20, 1:00 PM",
    channel: "internal",
  },
  {
    id: "gm5",
    threadId: "g1",
    sender: "team",
    senderName: "Rahul Sharma",
    content: "Check GSTR-3B mismatch for Rathi Steels. ITC gap is ₹42K.",
    timestamp: "Aug 20, 2:30 PM",
    channel: "internal",
    isPinned: true,
  },
];
