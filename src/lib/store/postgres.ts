import type {
  Cycle, Meeting, MeetingInput, Notice, NoticeInput, Place, PlaceInput, PresenceRow, Query, Store, User,
  UserMeeting, UserSort, UserWithStats,
} from "./types";

type Row = Record<string, unknown>;

const d = (v: unknown) => (v instanceof Date ? v : new Date(String(v)));
const dn = (v: unknown) => (v == null ? null : d(v));
const n = (v: unknown) => (v == null ? null : Number(v));
const s = (v: unknown) => (v == null ? null : String(v));

export function escapeLike(q: string) {
  return q.replace(/[\\%_]/g, (c) => "\\" + c);
}

const USER_COLS = `u.id, u.email, u.name, u.photo_url, u.made_camp, u.camp_year, u.onboarded, u.created_at`;
function toUser(r: Row): User {
  return {
    id: String(r.id), email: String(r.email), name: String(r.name), photoUrl: s(r.photo_url),
    madeCamp: Boolean(r.made_camp), campYear: n(r.camp_year), onboarded: Boolean(r.onboarded), createdAt: d(r.created_at),
  };
}

function toPlace(r: Row): Place {
  return {
    id: String(r.id), name: String(r.name), address: String(r.address ?? ""), lat: n(r.lat), lng: n(r.lng),
    radiusM: Number(r.radius_m), isDefault: Boolean(r.is_default),
  };
}

function toCycle(r: Row): Cycle {
  return { id: String(r.id), name: String(r.name), startedAt: d(r.started_at), endedAt: dn(r.ended_at) };
}

const MEETING_SELECT = `
  select m.id, m.cycle_id, m.place_id, p.name as place_name, m.theme, m.description,
         to_char(m.date, 'YYYY-MM-DD') as date, m.starts_at, m.closes_at, m.is_visible, m.password,
         (select count(*)::int from presences x where x.meeting_id = m.id) as presence_count,
         (select count(*)::int from presences x where x.meeting_id = m.id and x.location = 'none') as no_location_count
  from meetings m left join places p on p.id = m.place_id`;
function toMeeting(r: Row): Meeting {
  return {
    id: String(r.id), cycleId: String(r.cycle_id), placeId: s(r.place_id), placeName: s(r.place_name),
    theme: String(r.theme), description: String(r.description ?? ""), date: String(r.date),
    startsAt: d(r.starts_at), closesAt: d(r.closes_at), isVisible: Boolean(r.is_visible), password: String(r.password ?? ""),
    presenceCount: Number(r.presence_count ?? 0), noLocationCount: Number(r.no_location_count ?? 0),
  };
}

function toNotice(r: Row): Notice {
  return {
    id: String(r.id), title: String(r.title), body: String(r.body ?? ""), linkUrl: s(r.link_url), pinned: Boolean(r.pinned),
    expiresOn: s(r.expires_on), createdBy: String(r.created_by), createdAt: d(r.created_at),
  };
}

// Estatísticas do ciclo (total e última presença) calculadas na leitura: não existe contador para dessincronizar.
const STATS = (cycleParam: string) => `
  (select count(*)::int from presences x join meetings mm on mm.id = x.meeting_id
    where x.user_id = u.id and mm.cycle_id = ${cycleParam}) as total,
  (select to_char(max(mm.date), 'YYYY-MM-DD') from presences x join meetings mm on mm.id = x.meeting_id
    where x.user_id = u.id and mm.cycle_id = ${cycleParam}) as last_presence`;

export function createPostgresStore(query: Query): Store {
  const one = async (text: string, params: unknown[] = []) => (await query(text, params))[0] ?? null;

  return {
    async upsertUserFromLogin({ email, name, photoUrl }) {
      const r = await one(
        `insert into users (email, name, photo_url) values ($1, $2, $3)
         on conflict (email) do update set photo_url = coalesce(excluded.photo_url, users.photo_url)
         returning id, email, name, photo_url, made_camp, camp_year, onboarded, created_at`,
        [email.toLowerCase(), name, photoUrl],
      );
      return toUser(r!);
    },
    async getUserByEmail(email) {
      const r = await one(`select ${USER_COLS} from users u where u.email = $1`, [email.toLowerCase()]);
      return r ? toUser(r) : null;
    },
    async getUser(id) {
      const r = await one(`select ${USER_COLS} from users u where u.id = $1`, [id]);
      return r ? toUser(r) : null;
    },
    async updateProfile(id, { name, madeCamp, campYear }) {
      await query(`update users set name = $2, made_camp = $3, camp_year = $4, onboarded = true where id = $1`, [
        id, name, madeCamp, madeCamp ? campYear : null,
      ]);
    },
    async listUsers({ q, sort = "name", desc = false, limit, offset, cycleId }) {
      const params: unknown[] = [cycleId];
      let where = "";
      if (q?.trim()) {
        params.push(`%${escapeLike(q.trim())}%`);
        where = `where unaccent(u.name) ilike unaccent($2) or u.email ilike $2`;
      }
      const order: Record<UserSort, string> = {
        name: `lower(unaccent(u.name)) ${desc ? "desc" : "asc"}`,
        total: `total ${desc ? "desc" : "asc"}, lower(unaccent(u.name))`,
        last: `last_presence ${desc ? "desc nulls last" : "asc nulls first"}, lower(unaccent(u.name))`,
      };
      const rows = await query(
        `select ${USER_COLS}, ${STATS("$1")}, count(*) over()::int as full_count
         from users u ${where} order by ${order[sort]} limit ${Number(limit)} offset ${Number(offset)}`,
        params,
      );
      let total = Number(rows[0]?.full_count ?? 0);
      if (!rows.length && offset > 0) {
        const c = await one(`select count(*)::int as c from users u ${where.replaceAll("$2", "$1")}`, params.slice(1));
        total = Number(c?.c ?? 0);
      }
      return { rows: rows.map((r) => ({ ...toUser(r), total: Number(r.total), lastPresence: s(r.last_presence) })), total };
    },
    async searchUsers(q, limit) {
      const rows = await query(
        `select ${USER_COLS} from users u where unaccent(u.name) ilike unaccent($1) or u.email ilike $1
         order by lower(unaccent(u.name)) limit ${Number(limit)}`,
        [`%${escapeLike(q.trim())}%`],
      );
      return rows.map(toUser);
    },
    async userStats(userId, cycleId) {
      const r = await one(`select ${STATS("$2")} from users u where u.id = $1`, [userId, cycleId]);
      return { total: Number(r?.total ?? 0), lastPresence: s(r?.last_presence) };
    },

    async listAdmins() {
      const rows = await query(`select email, added_by, added_at from admins order by email`);
      return rows.map((r) => ({ email: String(r.email), addedBy: String(r.added_by), addedAt: d(r.added_at) }));
    },
    async isAdminInDb(email) {
      return Boolean(await one(`select 1 from admins where email = $1`, [email.toLowerCase()]));
    },
    async addAdmin(email, by) {
      await query(`insert into admins (email, added_by) values ($1, $2) on conflict do nothing`, [email.toLowerCase(), by]);
    },
    async removeAdmin(email) {
      await query(`delete from admins where email = $1`, [email.toLowerCase()]);
    },

    async listPlaces() {
      return (await query(`select * from places order by is_default desc, name`)).map(toPlace);
    },
    async getPlace(id) {
      const r = await one(`select * from places where id = $1`, [id]);
      return r ? toPlace(r) : null;
    },
    async createPlace(i: PlaceInput) {
      const r = await one(
        `insert into places (name, address, lat, lng, radius_m, is_default)
         values ($1, $2, $3, $4, $5, not exists (select 1 from places)) returning id`,
        [i.name, i.address, i.lat, i.lng, i.radiusM],
      );
      return String(r!.id);
    },
    async updatePlace(id, i) {
      await query(`update places set name = $2, address = $3, lat = $4, lng = $5, radius_m = $6 where id = $1`, [
        id, i.name, i.address, i.lat, i.lng, i.radiusM,
      ]);
    },
    async setDefaultPlace(id) {
      await query(`update places set is_default = (id = $1)`, [id]);
    },
    async deletePlace(id) {
      await query(`delete from places where id = $1`, [id]);
    },

    async currentCycle() {
      const r = await one(`select * from cycles where ended_at is null`);
      if (r) return toCycle(r);
      const created = await one(`insert into cycles (name) values ('Ciclo atual') on conflict do nothing returning *`);
      return toCycle(created ?? (await one(`select * from cycles where ended_at is null`))!);
    },
    async listCycles() {
      return (await query(`select * from cycles order by started_at desc`)).map(toCycle);
    },
    async startNewCycle(name) {
      // Fecha o ciclo aberto e abre outro numa única instrução (atômica).
      // Reuniões que ainda não começaram passam para o ciclo novo.
      const r = await one(
        `with closed as (update cycles set ended_at = now() where ended_at is null returning id),
         created as (insert into cycles (name, started_at) select $1, now() from (select count(*) from closed) c returning *),
         moved as (update meetings set cycle_id = (select id from created)
                   where cycle_id in (select id from closed) and starts_at > now() returning id)
         select created.*, (select count(*) from moved) as moved from created`,
        [name],
      );
      return toCycle(r!);
    },

    async listMeetings({ cycleId, q, onlyVisible, limit, offset }) {
      const where: string[] = [];
      const params: unknown[] = [];
      const add = (cond: string, v: unknown) => {
        params.push(v);
        where.push(cond.replace("?", `$${params.length}`));
      };
      if (cycleId) add("m.cycle_id = ?", cycleId);
      if (q?.trim()) add("unaccent(m.theme) ilike unaccent(?)", `%${escapeLike(q.trim())}%`);
      if (onlyVisible) where.push("m.is_visible");
      const w = where.length ? ` where ${where.join(" and ")}` : "";
      const rows = await query(
        `select * , count(*) over()::int as full_count from (${MEETING_SELECT}${w}) m2
         order by date desc, starts_at desc limit ${Number(limit)} offset ${Number(offset)}`,
        params,
      );
      let total = Number(rows[0]?.full_count ?? 0);
      if (!rows.length && offset > 0) total = Number((await one(`select count(*)::int as c from meetings m${w}`, params))?.c ?? 0);
      return { rows: rows.map(toMeeting), total };
    },
    async getMeeting(id) {
      const r = await one(`${MEETING_SELECT} where m.id = $1`, [id]);
      return r ? toMeeting(r) : null;
    },
    async createMeeting(i: MeetingInput, cycleId, by) {
      const r = await one(
        `insert into meetings (cycle_id, place_id, theme, description, date, starts_at, closes_at, is_visible, created_by, password)
         values ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10) returning id`,
        [cycleId, i.placeId, i.theme, i.description, i.date, i.startsAt, i.closesAt, i.isVisible, by, i.password],
      );
      return String(r!.id);
    },
    async updateMeeting(id, i) {
      await query(
        `update meetings set place_id = $2, theme = $3, description = $4, date = $5::date, starts_at = $6, closes_at = $7, is_visible = $8, password = $9
         where id = $1`,
        [id, i.placeId, i.theme, i.description, i.date, i.startsAt, i.closesAt, i.isVisible, i.password],
      );
    },
    async deleteMeeting(id) {
      await query(`delete from meetings where id = $1`, [id]);
    },
    async openMeetings(now) {
      const rows = await query(
        `${MEETING_SELECT} join cycles c on c.id = m.cycle_id
         where m.is_visible and c.ended_at is null and m.starts_at <= $1 and m.closes_at >= $1
         order by m.starts_at desc`,
        [now],
      );
      return rows.map(toMeeting);
    },
    async userMeetings(userId, cycleId, onlyVisible) {
      const rows = await query(
        `select m.*, pr.location as my_location, pr.source as my_source from (${MEETING_SELECT}) m
         left join presences pr on pr.meeting_id = m.id and pr.user_id = $1
         where m.cycle_id = $2 ${onlyVisible ? "and (m.is_visible or pr.user_id is not null)" : ""}
         order by m.date desc, m.starts_at desc`,
        [userId, cycleId],
      );
      return rows.map(
        (r): UserMeeting => ({
          ...toMeeting(r),
          present: r.my_location != null,
          location: (r.my_location as UserMeeting["location"]) ?? null,
          source: (r.my_source as UserMeeting["source"]) ?? null,
        }),
      );
    },

    async addPresence({ meetingId, userId, source, location, markedBy }) {
      const rows = await query(
        `insert into presences (meeting_id, user_id, source, location, marked_by) values ($1, $2, $3, $4, $5)
         on conflict do nothing returning user_id`,
        [meetingId, userId, source, location, markedBy],
      );
      return rows.length > 0;
    },
    async removePresence(meetingId, userId) {
      await query(`delete from presences where meeting_id = $1 and user_id = $2`, [meetingId, userId]);
    },
    async meetingPresences(meetingId, opts = {}) {
      const params: unknown[] = [meetingId];
      let extra = "";
      if (opts.onlyNoLocation) extra += ` and pr.location = 'none'`;
      if (opts.q?.trim()) {
        params.push(`%${escapeLike(opts.q.trim())}%`);
        extra += ` and unaccent(u.name) ilike unaccent($2)`;
      }
      const rows = await query(
        `select ${USER_COLS}, pr.created_at as pr_created_at, pr.source, pr.location, pr.marked_by,
           (select count(*)::int from presences x join meetings mm on mm.id = x.meeting_id
             where x.user_id = u.id and mm.cycle_id = m.cycle_id) as total_in_cycle
         from presences pr join users u on u.id = pr.user_id join meetings m on m.id = pr.meeting_id
         where pr.meeting_id = $1 ${extra}
         order by pr.created_at`,
        params,
      );
      return rows.map(
        (r): PresenceRow => ({
          user: toUser(r), createdAt: d(r.pr_created_at), source: r.source as PresenceRow["source"],
          location: r.location as PresenceRow["location"], markedBy: s(r.marked_by), totalInCycle: Number(r.total_in_cycle),
        }),
      );
    },

    async listNotices({ activeOn }) {
      const rows = await query(
        `select id, title, body, link_url, pinned, to_char(expires_on, 'YYYY-MM-DD') as expires_on, created_by, created_at
         from notices ${activeOn ? "where expires_on is null or expires_on >= $1::date" : ""}
         order by pinned desc, created_at desc`,
        activeOn ? [activeOn] : [],
      );
      return rows.map(toNotice);
    },
    async createNotice(i: NoticeInput, by) {
      const r = await one(
        `insert into notices (title, body, link_url, pinned, expires_on, created_by) values ($1, $2, $3, $4, $5::date, $6) returning id`,
        [i.title, i.body, i.linkUrl, i.pinned, i.expiresOn, by],
      );
      return String(r!.id);
    },
    async updateNotice(id, i) {
      await query(`update notices set title = $2, body = $3, link_url = $4, pinned = $5, expires_on = $6::date where id = $1`, [
        id, i.title, i.body, i.linkUrl, i.pinned, i.expiresOn,
      ]);
    },
    async deleteNotice(id) {
      await query(`delete from notices where id = $1`, [id]);
    },

    async cycleReport(cycleId) {
      const meetings = (await query(`${MEETING_SELECT} where m.cycle_id = $1 order by m.date, m.starts_at`, [cycleId])).map(toMeeting);
      const users = (
        await query(`select ${USER_COLS}, ${STATS("$1")} from users u order by lower(unaccent(u.name))`, [cycleId])
      ).map((r): UserWithStats => ({ ...toUser(r), total: Number(r.total), lastPresence: s(r.last_presence) }));
      const presences = (
        await query(
          `select pr.meeting_id, pr.user_id, pr.location from presences pr join meetings m on m.id = pr.meeting_id where m.cycle_id = $1`,
          [cycleId],
        )
      ).map((r) => ({ meetingId: String(r.meeting_id), userId: String(r.user_id), location: r.location as "ok" | "none" }));
      return { meetings, users, presences };
    },
  };
}
