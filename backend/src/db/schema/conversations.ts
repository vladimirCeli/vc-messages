import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  isGroup: boolean('is_group').default(false).notNull(),
  avatarUrl: text('avatar_url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  updatedAtIdx: index('conv_updated_idx').on(table.updatedAt),
}))

export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  unreadCount: integer('unread_count').default(0).notNull(),
}, (table) => ({
  convUserIdx: index('conv_user_idx').on(table.conversationId, table.userId),
}))
