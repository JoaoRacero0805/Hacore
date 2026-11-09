export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export type User = {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  madeCamp: boolean;
  campYear: number | null;
  onboarded: boolean;
  createdAt: Date;
};

export type UserWithStats = User & { total: number; lastPresence: string | null };

export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  radiusM: number;
  isDefault: boolean;
};

export type Cycle = { id: string; name: string; startedAt: Date; endedAt: Date | null };

export type Meeting = {
  id: string;
  cycleId: string;
  placeId: string | null;
  placeName: string | null;
  theme: string;
  description: string;
  date: string; // YYYY-MM-DD
  startsAt: Date;
  closesAt: Date;
  isVisible: boolean;
  presenceCount: number;
  noLocationCount: number;
};

export type MeetingInput = {
  theme: string;
  description: string;
  date: string;
  startsAt: Date;
  closesAt: Date;
  placeId: string | null;
  isVisible: boolean;
};

export type LocationStatus = "ok" | "none";

export type PresenceRow = {
  user: User;
  createdAt: Date;
  source: "self" | "admin";
  location: LocationStatus;
  markedBy: string | null;
  totalInCycle: number;
};

export type UserMeeting = Meeting & { present: boolean; location: LocationStatus | null; source: "self" | "admin" | null };

export type Notice = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  pinned: boolean;
  expiresOn: string | null;
  createdBy: string;
  createdAt: Date;
};

export type NoticeInput = { title: string; body: string; linkUrl: string | null; pinned: boolean; expiresOn: string | null };

export type PlaceInput = { name: string; address: string; lat: number | null; lng: number | null; radiusM: number };

export type UserSort = "name" | "total" | "last";

export interface Store {
  // usuários
  upsertUserFromLogin(input: { email: string; name: string; photoUrl: string | null }): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  updateProfile(id: string, patch: { name: string; madeCamp: boolean; campYear: number | null }): Promise<void>;
  listUsers(opts: { q?: string; sort?: UserSort; desc?: boolean; limit: number; offset: number; cycleId: string }): Promise<{ rows: UserWithStats[]; total: number }>;
  searchUsers(q: string, limit: number): Promise<User[]>;
  userStats(userId: string, cycleId: string): Promise<{ total: number; lastPresence: string | null }>;

  // admins
  listAdmins(): Promise<{ email: string; addedBy: string; addedAt: Date }[]>;
  isAdminInDb(email: string): Promise<boolean>;
  addAdmin(email: string, by: string): Promise<void>;
  removeAdmin(email: string): Promise<void>;

  // locais
  listPlaces(): Promise<Place[]>;
  getPlace(id: string): Promise<Place | null>;
  createPlace(input: PlaceInput): Promise<string>;
  updatePlace(id: string, input: PlaceInput): Promise<void>;
  setDefaultPlace(id: string): Promise<void>;
  deletePlace(id: string): Promise<void>;

  // ciclos
  currentCycle(): Promise<Cycle>;
  listCycles(): Promise<Cycle[]>;
  startNewCycle(name: string): Promise<Cycle>;

  // reuniões
  listMeetings(opts: { cycleId?: string; q?: string; onlyVisible?: boolean; limit: number; offset: number }): Promise<{ rows: Meeting[]; total: number }>;
  getMeeting(id: string): Promise<Meeting | null>;
  createMeeting(input: MeetingInput, cycleId: string, by: string): Promise<string>;
  updateMeeting(id: string, input: MeetingInput): Promise<void>;
  deleteMeeting(id: string): Promise<void>;
  openMeetings(now: Date): Promise<Meeting[]>;
  userMeetings(userId: string, cycleId: string, onlyVisible: boolean): Promise<UserMeeting[]>;

  // presenças
  addPresence(input: { meetingId: string; userId: string; source: "self" | "admin"; location: LocationStatus; markedBy: string | null }): Promise<boolean>;
  removePresence(meetingId: string, userId: string): Promise<void>;
  meetingPresences(meetingId: string, opts?: { onlyNoLocation?: boolean; q?: string }): Promise<PresenceRow[]>;

  // mural
  listNotices(opts: { activeOn?: string }): Promise<Notice[]>;
  createNotice(input: NoticeInput, by: string): Promise<string>;
  updateNotice(id: string, input: NoticeInput): Promise<void>;
  deleteNotice(id: string): Promise<void>;

  // exportação
  cycleReport(cycleId: string): Promise<{ meetings: Meeting[]; users: UserWithStats[]; presences: { meetingId: string; userId: string; location: LocationStatus }[] }>;
}
