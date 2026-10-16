import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Users table
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 20 }).default('offline').notNull(),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  usernameIdx: index('username_idx').on(table.username),
}))

/**
 * Conversations table
 */
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

/**
 * Conversation participants
 */
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

/**
 * Messages table - OPTIMIZED with indexes
 */
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('text').notNull(),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  mediaSize: integer('media_size'),
  replyToId: uuid('reply_to_id').references((): any => messages.id),
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  convCreatedIdx: index('msg_conv_created_idx').on(table.conversationId, table.createdAt),
  senderIdx: index('msg_sender_idx').on(table.senderId),
}))

/**
 * Message read receipts
 */
export const messageReads = pgTable('message_reads', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => ({
  msgUserIdx: index('read_msg_user_idx').on(table.messageId, table.userId),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  participations: many(conversationParticipants),
  messageReads: many(messageReads),
}))

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  reads: many(messageReads),
}))
